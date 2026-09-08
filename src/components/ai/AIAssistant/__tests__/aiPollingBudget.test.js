jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn()
  }
}));

import { renderHook, act } from '@testing-library/react';

import { generateContent } from '../AIContentService';
import { pollAiRequest, stopAiRequestPolling } from '../aiRequestPolling';
import { generateScript } from '../ScriptAIService';
import { generateText } from '../TextAIService';
import {
  AI_POLL_INTERVAL_MAX_MS,
  AI_POLL_INTERVAL_MIN_MS,
  AI_POLL_RAMP_MS,
  AI_REQUEST_TIMEOUT_MS,
  AI_REQUEST_TIMEOUT_SLACK_MS,
  AI_REQUEST_WAIT_MS,
  API_ENDPOINTS,
  BPMN_AI_REQUEST_TIMEOUT_MS,
  BPMN_AI_REQUEST_WAIT_MS,
  CONTENT_TYPES,
  getAiPollDelay
} from '../constants';
import usePolling from '../hooks/usePolling';

// D-G-FE-TIMEOUT (cases G1–G14). The three field services poll their own request rather than going
// through `usePolling`, and each held a private `MAX_POLLING_ATTEMPTS = 120` — two minutes against
// the backend's thirty. They gave up on requests that were running perfectly well, and the answer
// that arrived afterwards was kept by the server for another hour with nobody left to collect it.
//
// D-X-CHATPOLLGAP (case X16, COREDEV-485). The chat panel then kept a ten-minute watchdog of its
// own — the one client path without a guard — while runs of eighteen to twenty-seven minutes
// through the same endpoint finished normally. Every path now waits the same, and what is pinned
// here is behaviour: a poller still asking just before its budget, giving up right at it, and
// spending the budget at a fraction of the flat rate. A private number in any path fails these.
describe('AI polling budget', () => {
  const processing = { status: 'processing' };

  // Steps the fake clock through a whole budget in five-second slices, flushing the promise chain
  // of every poll on the way — `advanceTimersByTime` alone fires one poll per call, whatever the
  // interval, because the successor timer is armed only after `fetchStatus` resolves.
  const runFor = async ms => {
    for (let elapsed = 0; elapsed < ms; elapsed += 5000) {
      await jest.advanceTimersByTimeAsync(Math.min(5000, ms - elapsed));
    }
  };

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('the numbers', () => {
    it('restate the limits that actually decide the outcome', () => {
      // `citeck.ai.agent-execution.request-timeout` (`AgentExecutionProperties.DEFAULT_REQUEST_TIMEOUT`)
      // and `BpmnAssistantController.REQUEST_TIMEOUT_MINUTES` in citeck-ai.
      // The largest configured backend request-timeout: 45m on the DeepSeek launch profile (2026-09-08).
      expect(AI_REQUEST_TIMEOUT_MS).toBe(45 * 60 * 1000);
      expect(BPMN_AI_REQUEST_TIMEOUT_MS).toBe(10 * 60 * 1000);
    });

    it('wait longer than the backend, never the same or less', () => {
      // Equal budgets race, and the backend's timer starts first — the client would give up on
      // the very poll that carries the backend's verdict.
      expect(AI_REQUEST_TIMEOUT_SLACK_MS).toBeGreaterThan(0);
      expect(AI_REQUEST_WAIT_MS).toBe(AI_REQUEST_TIMEOUT_MS + AI_REQUEST_TIMEOUT_SLACK_MS);
      expect(BPMN_AI_REQUEST_WAIT_MS).toBe(BPMN_AI_REQUEST_TIMEOUT_MS + AI_REQUEST_TIMEOUT_SLACK_MS);
    });
  });

  describe('getAiPollDelay', () => {
    it('starts at the minimum interval', () => {
      expect(getAiPollDelay(0)).toBe(AI_POLL_INTERVAL_MIN_MS);
    });

    it('reaches the maximum at the end of the ramp and stays there', () => {
      expect(getAiPollDelay(AI_POLL_RAMP_MS)).toBe(AI_POLL_INTERVAL_MAX_MS);
      expect(getAiPollDelay(AI_POLL_RAMP_MS * 10)).toBe(AI_POLL_INTERVAL_MAX_MS);
      expect(getAiPollDelay(AI_REQUEST_WAIT_MS)).toBe(AI_POLL_INTERVAL_MAX_MS);
    });

    it('grows monotonically in between', () => {
      const delays = [0, 5000, 10000, 20000, 30000].map(getAiPollDelay);

      delays.forEach((delay, index) => {
        if (index > 0) {
          expect(delay).toBeGreaterThanOrEqual(delays[index - 1]);
        }
        expect(delay).toBeGreaterThanOrEqual(AI_POLL_INTERVAL_MIN_MS);
        expect(delay).toBeLessThanOrEqual(AI_POLL_INTERVAL_MAX_MS);
      });
    });

    it('never returns less than the minimum for a nonsensical input', () => {
      expect(getAiPollDelay(-1000)).toBe(AI_POLL_INTERVAL_MIN_MS);
    });
  });

  describe('pollAiRequest (the field services)', () => {
    const statusUrl = API_ENDPOINTS.UNIVERSAL_STATUS;

    it('is still asking just before the budget, and gives up right at it', async () => {
      fetchMock.mockResponse(JSON.stringify(processing));
      const onGiveUp = jest.fn();
      const promise = pollAiRequest({ requestId: 'req-1', statusUrl, onGiveUp });
      const rejection = expect(promise).rejects.toMatchObject({ isTimeout: true });

      await runFor(AI_REQUEST_WAIT_MS - AI_POLL_INTERVAL_MAX_MS);
      expect(onGiveUp).not.toHaveBeenCalled();
      const pollsSoFar = fetchMock.mock.calls.length;

      await runFor(AI_POLL_INTERVAL_MAX_MS * 2);
      expect(onGiveUp).toHaveBeenCalledTimes(1);
      await rejection;

      // Nothing after giving up
      const pollsAtGiveUp = fetchMock.mock.calls.length;
      expect(pollsAtGiveUp).toBeGreaterThanOrEqual(pollsSoFar);
      await runFor(60 * 1000);
      expect(fetchMock.mock.calls.length).toBe(pollsAtGiveUp);
    });

    // The point of the ramp: thirty-five minutes must not become two thousand requests. A flat
    // one-second interval would; ramped to five, the whole budget costs a few hundred polls.
    it('spends the whole budget at a fraction of the flat rate', async () => {
      fetchMock.mockResponse(JSON.stringify(processing));
      const promise = pollAiRequest({ requestId: 'req-1', statusUrl });
      const rejection = expect(promise).rejects.toMatchObject({ isTimeout: true });

      await runFor(AI_REQUEST_WAIT_MS + AI_POLL_INTERVAL_MAX_MS);
      await rejection;

      const flatRatePolls = AI_REQUEST_WAIT_MS / AI_POLL_INTERVAL_MIN_MS;
      expect(fetchMock.mock.calls.length).toBeLessThan(flatRatePolls / 4);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(flatRatePolls / 6);
    });

    it('honours a budget of its own and stops when told to', async () => {
      fetchMock.mockResponse(JSON.stringify(processing));
      const promise = pollAiRequest({ requestId: 'req-2', statusUrl, waitMs: 10 * 1000 });
      const rejection = expect(promise).rejects.toMatchObject({ isTimeout: true });

      await runFor(9 * 1000);
      const before = fetchMock.mock.calls.length;
      expect(before).toBeGreaterThan(1);
      await runFor(6 * 1000);
      await rejection;

      // A stopped poll never asks again
      fetchMock.mockClear();
      pollAiRequest({ requestId: 'req-3', statusUrl }).catch(() => {});
      await jest.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(stopAiRequestPolling('req-3')).toBe(true);
      await runFor(10 * 1000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(stopAiRequestPolling('req-3')).toBe(false);
    });
  });

  // The services give up through the shared poller — and cancel the request they are abandoning.
  // A service that grew a budget of its own would resolve, reject early, or forget to cancel.
  describe.each([
    ['generateText', () => generateText({ currentText: 'x', intent: 'improve' })],
    ['generateScript', () => generateScript({ currentScript: 'x', prompt: 'y', contextType: 'dev_console' })],
    ['generateContent', () => generateContent({ currentContent: 'x', contentType: CONTENT_TYPES.TEXT })]
  ])('%s', (_name, start) => {
    it('waits the shared budget, then times out and cancels the request', async () => {
      fetchMock.mockResponse(async req => {
        if (req.method === 'POST') return JSON.stringify({ requestId: 'req-svc' });
        if (req.method === 'DELETE') return JSON.stringify({ status: 'cancelled' });
        return JSON.stringify(processing);
      });

      const promise = start();
      const rejection = expect(promise).rejects.toMatchObject({ isTimeout: true });
      await jest.advanceTimersByTimeAsync(0);

      await runFor(AI_REQUEST_WAIT_MS - AI_POLL_INTERVAL_MAX_MS);
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
      const statusPolls = fetchMock.mock.calls.filter(([url, init]) => !init?.method && String(url).includes('req-svc')).length;
      expect(statusPolls).toBeGreaterThan(300);

      await runFor(AI_POLL_INTERVAL_MAX_MS * 2);
      await rejection;
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
    });
  });

  describe('usePolling (the chat panels)', () => {
    const renderPolling = (overrides = {}) => {
      const fetchStatus = jest.fn().mockResolvedValue(processing);
      const onError = jest.fn();
      const rendered = renderHook(() => usePolling({ fetchStatus, onError, onResult: jest.fn(), ...overrides }));
      return { ...rendered, fetchStatus, onError };
    };

    it('is still asking just before the budget, and gives up right at it', async () => {
      const { result, fetchStatus, onError } = renderPolling();

      act(() => {
        result.current.startPolling('req-1');
      });

      await act(() => runFor(AI_REQUEST_WAIT_MS - AI_POLL_INTERVAL_MAX_MS));
      expect(onError).not.toHaveBeenCalled();
      expect(result.current.isPolling).toBe(true);

      await act(() => runFor(AI_POLL_INTERVAL_MAX_MS * 2));
      expect(onError).toHaveBeenCalledWith('ai-assistant.chat.polling-timeout', { requestAlive: true });
      expect(result.current.isPolling).toBe(false);

      const polls = fetchStatus.mock.calls.length;
      const flatRatePolls = AI_REQUEST_WAIT_MS / AI_POLL_INTERVAL_MIN_MS;
      expect(polls).toBeLessThan(flatRatePolls / 4);
      expect(polls).toBeGreaterThan(flatRatePolls / 6);
    });

    it('takes a budget of its own for a backend with a shorter limit', async () => {
      const { result, onError } = renderPolling({ timeoutMs: BPMN_AI_REQUEST_WAIT_MS });

      act(() => {
        result.current.startPolling('req-1');
      });

      await act(() => runFor(BPMN_AI_REQUEST_WAIT_MS - AI_POLL_INTERVAL_MAX_MS));
      expect(onError).not.toHaveBeenCalled();

      await act(() => runFor(AI_POLL_INTERVAL_MAX_MS * 2));
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
