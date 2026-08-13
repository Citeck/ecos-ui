import { renderHook, act } from '@testing-library/react';
import { StrictMode } from 'react';

import { CHAT_SESSION_STORAGE_KEY } from '../chatSessionStorage';
import { CHAT_SESSION_TTL_MS, POLLING_INTERVAL } from '../constants';
import useUniversalChat from '../hooks/useUniversalChat';
import { isGateStale } from '../utils';

import { t } from '@/helpers/export/util';

// D-B-14, resumption side. A request started before a page reload keeps running on the server; the
// pair saved in sessionStorage (written by the tests in useUniversalChat.test.js) is the only way
// back to it. These tests cover picking it up again — and, just as importantly, NOT picking it up
// when the panel stays closed, because the hook is mounted on every page of the application.

// Every startPolling call, recorded around the real polling hook. The real one is kept (rather than
// a stub) so that the 404 branch below goes through the actual poll loop.
const mockStartPollingCalls = [];

jest.mock('../hooks/usePolling', () => {
  const actualUsePolling = jest.requireActual('../hooks/usePolling').default;

  return {
    __esModule: true,
    default: options => {
      const api = actualUsePolling(options);

      return {
        ...api,
        startPolling: requestId => {
          mockStartPollingCalls.push(requestId);
          return api.startPolling(requestId);
        }
      };
    }
  };
});

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  generateUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 8))
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

jest.mock('@citeck/records-core', () => ({
  get: jest.fn(() => ({ load: jest.fn() }))
}));

jest.mock('../EditorContextService', () => ({
  getContextData: jest.fn(() => ({})),
  getHandler: jest.fn(),
  clearContext: jest.fn()
}));

jest.useFakeTimers();

describe('useUniversalChat - resuming an active request (D-B-14)', () => {
  const seedSession = (conversationId, requestId, savedAt = Date.now(), agent = null) =>
    sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ conversationId, requestId, agent, savedAt }));

  const storedSession = () => JSON.parse(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY) || 'null');

  const renderChat = (isOpen, options = {}) =>
    renderHook(({ isOpen: open }) => useUniversalChat({ isOpen: open }), { initialProps: { isOpen }, ...options });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStartPollingCalls.length = 0;
    sessionStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    sessionStorage.clear();
  });

  // 17
  it('resumes polling with the stored requestId when the panel is opened', () => {
    seedSession('conv-1', 'req-restored');

    const { result, rerender } = renderChat(false);

    // Closed panel — nothing has happened yet
    expect(mockStartPollingCalls).toEqual([]);

    rerender({ isOpen: true });

    expect(mockStartPollingCalls).toEqual(['req-restored']);
    expect(result.current.conversationId).toBe('conv-1');
  });

  // 18
  it('shows exactly one processing card and blocks the input while the request is resumed', () => {
    seedSession('conv-1', 'req-restored');

    const { result } = renderChat(true);

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ sender: 'ai', isProcessing: true, pollingIsUsed: true });
    // Without this the user can send a second question, whose startPolling bumps the generation
    // token and kills the resumed poll while its card keeps spinning
    expect(result.current.isLoading).toBe(true);
  });

  // 19
  it('resumes nothing when the record holds a conversation but no active request', () => {
    seedSession('conv-1', null);

    const { result } = renderChat(true);

    expect(mockStartPollingCalls).toEqual([]);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    // The conversation itself is still continued by the next question
    expect(result.current.conversationId).toBe('conv-1');
  });

  // 20
  it('resumes nothing and drops the record when it is older than the polling window', () => {
    seedSession('conv-old', 'req-old', Date.now() - CHAT_SESSION_TTL_MS - 1000);

    const { result } = renderChat(true);

    expect(mockStartPollingCalls).toEqual([]);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(storedSession()).toBeNull();
    // A stale conversation is not continued either — the backend has forgotten it as well
    expect(result.current.conversationId).toMatch(/^test-uuid-/);
  });

  // 21 (StrictMode double invocation)
  it('resumes only once when the mount effect runs twice under StrictMode', async () => {
    seedSession('conv-1', 'req-restored');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ status: 'processing' }) });

    const { result } = renderChat(true, { wrapper: StrictMode });

    expect(result.current.messages).toHaveLength(1);

    // Not just "one card, one startPolling": the resumed request must actually be polled. StrictMode
    // runs setup → cleanup → setup, and the cleanup of `usePolling` clears the scheduled poll — a
    // restore latched by the first setup and turned away by the second would leave the card spinning
    // over a request nobody collects.
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('req-restored');
    // And exactly one poll loop is alive — a re-armed poll must replace the dead one, not add to it
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  // 21 (closing and reopening the panel)
  it('resumes only once when the panel is closed and opened again', () => {
    seedSession('conv-1', 'req-restored');

    const { result, rerender } = renderChat(true);

    expect(mockStartPollingCalls).toEqual(['req-restored']);

    rerender({ isOpen: false });
    rerender({ isOpen: true });
    rerender({ isOpen: false });
    rerender({ isOpen: true });

    expect(mockStartPollingCalls).toEqual(['req-restored']);
    expect(result.current.messages).toHaveLength(1);
  });

  // 22
  it('reports a lost request and stops when the resumed poll answers 404', async () => {
    seedSession('conv-1', 'req-gone');
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: jest.fn().mockResolvedValue(null) });

    const { result } = renderChat(true);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('req-gone');
    expect(result.current.messages[0]).toMatchObject({ text: t('ai-assistant.chat.request-lost'), isProcessing: false, isError: true });
    expect(result.current.isLoading).toBe(false);
    // The id is worthless now — the next reload must not resume it again
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: null });

    // No endless loop: the poll is not rescheduled after the failure
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL * 5);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // The mirror image of the 404 above. Polling has no retries, so a single failed fetch — a dropped
  // connection, a gateway 502, a laptop waking up — ends the turn on screen; the request behind it
  // keeps running server-side (30 min, plus an hour of result retention). Retiring the id there made
  // a long generation unreachable for good, which is the very loss D-B-14 exists to prevent.
  it('keeps the request resumable when a poll dies on a transport failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    seedSession('conv-1', 'req-alive');
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const { result, unmount } = renderChat(true);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.messages[0]).toMatchObject({ isProcessing: false, isError: true });
    expect(result.current.isLoading).toBe(false);
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-alive' });

    // ...so the next reload picks the very same request up and collects its answer
    unmount();
    mockStartPollingCalls.length = 0;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ result: { message: 'готово' } }) });

    const { result: reloaded } = renderChat(true);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(mockStartPollingCalls).toEqual(['req-alive']);
    expect(reloaded.current.messages).toHaveLength(1);
    expect(reloaded.current.messages[0]).toMatchObject({ text: 'готово', sender: 'ai' });
    expect(reloaded.current.isLoading).toBe(false);
    // And now that the answer is in, the id is marked finished rather than dropped: the turn may
    // have ended on a gate the backend is still holding, and this is what brings that card back on
    // the next opening (D-B-14).
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-alive', requestCompleted: true });
    consoleSpy.mockRestore();
  });

  // The same failure, without a reload. Closing and reopening the panel is what a user actually does
  // when a turn breaks, and it is the only recovery the interface offers by itself — the record is
  // kept for exactly this, so the latch that stops a repeat restore has to come down with the poll.
  it('resumes the surviving request when the panel is closed and opened again after a dead poll', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    seedSession('conv-1', 'req-alive');
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const { result, rerender } = renderChat(true);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(mockStartPollingCalls).toEqual(['req-alive']);
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-alive' });

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ result: { message: 'готово' } }) });

    act(() => rerender({ isOpen: false }));
    act(() => rerender({ isOpen: true }));

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(mockStartPollingCalls).toEqual(['req-alive', 'req-alive']);
    expect(result.current.messages[result.current.messages.length - 1]).toMatchObject({ text: 'готово', sender: 'ai' });
    expect(result.current.isLoading).toBe(false);
    // The answer is in, so the id is marked finished — and the resumption is not repeated after
    // that: the latch stays up, and a finished request would not be polled again anyway.
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-alive', requestCompleted: true });

    act(() => rerender({ isOpen: false }));
    act(() => rerender({ isOpen: true }));

    expect(mockStartPollingCalls).toEqual(['req-alive', 'req-alive']);
    consoleSpy.mockRestore();
  });

  // The resumed turn keeps its meaning: what is being picked up is the answer to a file-save click,
  // and `handlePollingError` keeps `pendingFileActionTempRef` for exactly that. The card appended
  // here stands in the list for the whole resumed poll, so unstamped it would count as a step of the
  // dialog — retiring the sibling gate of the Save/Cancel pair the backend is still waiting on: the
  // "waiting for your decision" hint disappears and a deploy card reports a decision nobody took.
  it('stamps the resumed processing card as a file notice when a file-save click is being resumed', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) });

    const { result, rerender } = renderChat(true);

    act(() => {
      result.current.setMessages([
        {
          id: 'msg-mixed',
          text: 'План готов',
          messageData: {
            actions: [
              { id: 'CONFIRM', label: 'Подтвердить' },
              { id: 'REJECT', label: 'Отклонить' },
              { id: 'new_record|temp-file@A', label: 'Save A' }
            ]
          }
        }
      ]);
    });

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-mixed' });
    });

    expect(storedSession()).toMatchObject({ requestId: 'req-file' });

    // The poll dies on a transport failure: the request itself was never reported finished, so the
    // id and the tracked tempRef are both kept and the restore latch comes back down
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(storedSession()).toMatchObject({ requestId: 'req-file' });

    act(() => rerender({ isOpen: false }));
    act(() => rerender({ isOpen: true }));

    expect(mockStartPollingCalls).toEqual(['req-file', 'req-file']);

    const messages = result.current.messages;
    const resumed = messages[messages.length - 1];
    expect(resumed.isProcessing).toBe(true);
    expect(resumed.isFileActionNotice).toBe(true);
    // What the flag is for: the gate of the same message is still live while the answer is on its way
    expect(isGateStale(messages, 0)).toBe(false);
    consoleSpy.mockRestore();
  });

  // The counterpart: a plain turn resumed after a reload carries no tempRef, and its card must go on
  // moving the dialog forward like any other message.
  it('leaves the resumed processing card unstamped when no file-save click is being resumed', () => {
    seedSession('conv-1', 'req-restored');

    const { result } = renderChat(true);

    expect(result.current.messages[0].isFileActionNotice).toBeUndefined();
  });

  // 22a — the main test of the "restore on open, not on mount" decision
  it('resumes nothing at all while the panel stays closed', async () => {
    seedSession('conv-1', 'req-restored');

    const { result } = renderChat(false);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL * 30);
    });

    expect(mockStartPollingCalls).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    // The record is left intact — the request is resumed later, when the user opens the panel
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-restored' });
  });

  // The latch is lowered by every `requestAlive` failure, so it cannot be the only thing standing
  // between a reopened panel and a request that is already being polled: by then `saveSession` has
  // overwritten the record with the NEXT turn's id. Restoring it would append a second processing
  // card for one request and call `startPolling` again — which bumps the generation in `usePolling`,
  // kills the poll in flight and restarts it with the watchdog counter back at zero.
  it('resumes nothing when a request is already being polled, even after an earlier poll gave up', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    seedSession('conv-1', 'req-1');

    // The restored poll of the first turn dies on a transport failure — the request stays alive, so
    // the id is kept and the latch comes back down
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const { result, rerender } = renderChat(true);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(mockStartPollingCalls).toEqual(['req-1']);
    expect(result.current.isLoading).toBe(false);

    // The user asks the next question: it gets its own id, which replaces `req-1` on the record, and
    // its poll is running when the panel is closed
    // The POST that opens the turn and the status polls share a prefix — they are told apart by the
    // `/async` suffix, not by a `/status/` segment the endpoint does not have
    global.fetch = jest.fn(url =>
      Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue(String(url).endsWith('/async') ? { requestId: 'req-2' } : { status: 'processing' })
      })
    );
    const statusPolls = () => global.fetch.mock.calls.filter(call => String(call[0]).endsWith('universal/req-2'));

    act(() => result.current.setMessage('следующий вопрос'));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(mockStartPollingCalls).toEqual(['req-1', 'req-2']);
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-2' });

    const processingCards = () => result.current.messages.filter(msg => msg.isProcessing).length;
    expect(processingCards()).toBe(1);

    act(() => rerender({ isOpen: false }));
    act(() => rerender({ isOpen: true }));

    // No third startPolling and no second card: the live poll of `req-2` is left alone
    expect(mockStartPollingCalls).toEqual(['req-1', 'req-2']);
    expect(processingCards()).toBe(1);

    // And it really is still the same poll — its next tick lands, rather than the loop having been
    // restarted or killed
    const pollsBefore = statusPolls().length;
    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });
    expect(statusPolls().length).toBe(pollsBefore + 1);

    consoleSpy.mockRestore();
  });

  // The other half of the same window. `activeRequestId` is set by `startPolling`, which runs only
  // once `POST /universal/async` has answered — so a question still travelling to the backend is
  // invisible to the guard above, while the record still holds the id of the turn before it.
  it('resumes nothing while a question is still on its way to the backend', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    seedSession('conv-1', 'req-1');

    // The restored poll of the first turn dies on a transport failure: the id stays on the record
    // and the latch comes back down, which is what makes the reopening below dangerous at all
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    const { result, rerender } = renderChat(true);

    await act(async () => {
      jest.advanceTimersByTime(POLLING_INTERVAL);
    });

    expect(mockStartPollingCalls).toEqual(['req-1']);
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-1' });

    // The user asks the next question and its POST is held in flight — no id exists for it yet
    let resolvePost;
    const postResponse = new Promise(resolve => {
      resolvePost = resolve;
    });
    global.fetch = jest.fn(url =>
      String(url).endsWith('/async')
        ? postResponse
        : Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ status: 'processing' }) })
    );

    act(() => result.current.setMessage('следующий вопрос'));

    let submitted;
    await act(async () => {
      submitted = result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(result.current.isLoading).toBe(true);
    expect(mockStartPollingCalls).toEqual(['req-1']);

    act(() => rerender({ isOpen: false }));
    act(() => rerender({ isOpen: true }));

    // Nothing was resumed on top of the turn being sent: no second poll chain over the stale id...
    expect(mockStartPollingCalls).toEqual(['req-1']);
    // ...and no processing card for a request that does not exist yet
    expect(result.current.messages.filter(msg => msg.isProcessing)).toHaveLength(0);

    await act(async () => {
      resolvePost({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-2' }) });
      await submitted;
    });

    // The turn lands on its own, with a single card and a single poll chain
    expect(mockStartPollingCalls).toEqual(['req-1', 'req-2']);
    expect(result.current.messages.filter(msg => msg.isProcessing)).toHaveLength(1);
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-2' });

    consoleSpy.mockRestore();
  });

  // The conversation is bound to its agent server-side, so restoring one without the other leaves
  // the chip telling the user something that is not true
  describe('the agent the restored conversation is bound to', () => {
    const AGENT = { id: 'contract-agent', name: 'Договоры', engine: 'CONFIG' };

    it('is restored together with the conversation', () => {
      seedSession('conv-1', null, Date.now(), AGENT);

      const { result } = renderChat(true);

      expect(result.current.selectedAgent).toEqual(AGENT);
      expect(result.current.conversationId).toBe('conv-1');
    });

    it('is the agent the next question is addressed to', async () => {
      seedSession('conv-1', null, Date.now(), AGENT);
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-next' }) });

      const { result } = renderChat(true);

      act(() => result.current.setMessage('продолжаем'));
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body).toMatchObject({ conversationId: 'conv-1', context: { agentRef: 'emodel/ai-agent@contract-agent' } });
      // And the record keeps saying so for the reload after this one
      expect(storedSession()).toMatchObject({ requestId: 'req-next', agent: AGENT });
    });

    it('stays absent when the stored conversation was never bound to one', () => {
      seedSession('conv-1', null);

      const { result } = renderChat(true);

      expect(result.current.selectedAgent).toBeNull();
    });
  });

  // Switching agents deletes the conversation, and the confirmation before that is decided by
  // whether there is a dialog to lose. After a reload the message list is empty by design, so the
  // list alone would answer "nothing to lose" for a conversation that is very much alive.
  describe('reporting a dialog hidden behind the empty message list', () => {
    it('reports a restored conversation as one', () => {
      seedSession('conv-1', null);

      const { result } = renderChat(true);

      expect(result.current.messages).toEqual([]);
      expect(result.current.hasRestoredConversation).toBe(true);
    });

    it('reports nothing when the chat started fresh', () => {
      const { result } = renderChat(true);

      expect(result.current.hasRestoredConversation).toBe(false);
    });

    it('stops reporting one once the conversation has been cleared', async () => {
      seedSession('conv-1', null);
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

      const { result } = renderChat(true);

      expect(result.current.hasRestoredConversation).toBe(true);

      await act(async () => {
        await result.current.clearConversation();
      });

      // The new conversation is empty on both sides — there is nothing hidden any more
      expect(result.current.hasRestoredConversation).toBe(false);
      expect(result.current.conversationId).toMatch(/^test-uuid-/);
    });
  });

  it('leaves a chat with nothing stored on its welcome screen', () => {
    const { result } = renderChat(true);

    expect(mockStartPollingCalls).toEqual([]);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // D-B-14, the other half (case B12). A turn may finish on a gate the backend goes on holding —
  // a deploy confirmation, an escalation. The answer is not lost with the page: the backend keeps a
  // finished result for an hour and returns it by the same id, so the card is collected rather than
  // resumed — one request, no polling, no processing card.
  describe('collecting a turn that finished before the reload', () => {
    const seedFinished = (conversationId, requestId) =>
      sessionStorage.setItem(
        CHAT_SESSION_STORAGE_KEY,
        JSON.stringify({ conversationId, requestId, requestCompleted: true, agent: null, savedAt: Date.now() })
      );

    const deployGate = {
      message: 'Развернуть изменения?',
      agentStatus: 'PENDING_DEPLOY',
      actions: [
        { id: 'CONFIRM', label: 'Развернуть' },
        { id: 'REJECT', label: 'Отменить' }
      ]
    };

    const answerWith = result => (global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ result }) }));

    it('brings the gate back without polling anything', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith(deployGate);

      const { result } = renderChat(true);
      await act(async () => {});

      expect(mockStartPollingCalls).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch.mock.calls[0][0]).toContain('req-done');
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({ text: 'Развернуть изменения?', sender: 'ai' });
      expect(result.current.messages[0].messageData.actions).toHaveLength(2);
      // The buttons are live — a gate that came back disabled would be no better than no gate.
      expect(isGateStale(result.current.messages, 0)).toBe(false);
    });

    // No spinner and no blocked input: nothing is running, the answer is already there.
    it('does not put the chat into a loading state', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith(deployGate);

      const { result } = renderChat(true);
      await act(async () => {});

      expect(result.current.isLoading).toBe(false);
      expect(result.current.messages.some(message => message.isProcessing)).toBe(false);
    });

    // The conversation survives either way, so the next question continues the same dialog.
    it('keeps the conversation the gate belongs to', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith(deployGate);

      const { result } = renderChat(true);
      await act(async () => {});

      expect(result.current.conversationId).toBe('conv-1');
      expect(result.current.hasRestoredConversation).toBe(true);
    });

    // The hour is up, or the service was restarted. An ordinary end for a finished turn — the user
    // asked for nothing here, the panel merely opened, so nothing is said.
    it('says nothing when the result is already gone', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      seedFinished('conv-1', 'req-done');
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: jest.fn().mockResolvedValue({}) });

      const { result } = renderChat(true);
      await act(async () => {});

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('collects nothing while the panel stays closed', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith(deployGate);

      const { result } = renderChat(false);
      await act(async () => {});

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.messages).toEqual([]);
    });

    // The latch that guards the resumption guards this too: closing and reopening the panel must
    // not stack a second copy of the same card.
    it('does not collect the same answer twice', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith(deployGate);

      const { result, rerender } = renderChat(true);
      await act(async () => {});

      act(() => rerender({ isOpen: false }));
      act(() => rerender({ isOpen: true }));
      await act(async () => {});

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.current.messages).toHaveLength(1);
    });

    it('survives the double mount effect of StrictMode', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith(deployGate);

      const { result } = renderChat(true, { wrapper: StrictMode });
      await act(async () => {});

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.current.messages).toHaveLength(1);
    });

    // An ordinary answer comes back the same way — the mark is on the request, not on the gate.
    it('brings back a plain answer as well', async () => {
      seedFinished('conv-1', 'req-done');
      answerWith({ message: 'готово' });

      const { result } = renderChat(true);
      await act(async () => {});

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({ text: 'готово', sender: 'ai' });
    });
  });
});
