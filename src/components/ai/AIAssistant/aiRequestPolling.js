import { AI_REQUEST_WAIT_MS, AI_STATUS_FETCH_TIMEOUT_MS, getAiPollDelay } from './constants';

import { t } from '@/helpers/export/util';

/**
 * The one place an AI request's status is fetched and read, for the chat panels (`usePolling`) and
 * the field services (`pollAiRequest` below) alike.
 *
 * Reads the endpoint the way the backend means it (`UniversalAssistantController`,
 * `BpmnAssistantController`):
 * - 2xx `{ result }` / `{ status: 'processing' | 'pending', progress? }` / `{ status: 'cancelled' }`
 *   come back as they are;
 * - a 4xx/5xx whose body carries `{ error }` is the backend's VERDICT on the request — it has
 *   failed, timed out or been rejected — and comes back as that `{ error, retryAfterSeconds? }`
 *   body, the same shape a poller handles for a 2xx error. It used to be thrown as a transport
 *   failure, and the chat then kept the request's id as "still running" and re-polled a dead
 *   request on every reopening of the panel for an hour;
 * - a 404 is a request the service no longer knows (restart, expiry, another user's): thrown with
 *   `requestLost`, so the caller can say that instead of "Error: 404" (D-B-7);
 * - any other non-2xx — a gateway error page, a 403 — is thrown with `httpStatus`;
 * - a GET that does not settle within `AI_STATUS_FETCH_TIMEOUT_MS` is aborted and thrown with
 *   `timedOut`; a failure of `fetch` itself is rethrown with `networkError`.
 *
 * @param {string} url - Full status URL of the request
 * @returns {Promise<Object>} The status body
 */
export const fetchAiStatus = async url => {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), AI_STATUS_FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    clearTimeout(abortTimer);
    if (controller.signal.aborted) {
      const err = new Error(t('ai-assistant.chat.polling-error'));
      err.timedOut = true;
      throw err;
    }
    if (error && typeof error === 'object') {
      error.networkError = true;
    }
    throw error;
  }
  clearTimeout(abortTimer);

  if (response.ok) {
    return response.json();
  }

  if (response.status === 404) {
    const err = new Error(t('ai-assistant.chat.request-lost'));
    err.requestLost = true;
    throw err;
  }

  const body = await response.json().catch(() => null);
  if (body?.error) {
    const verdict = { error: body.error };
    if (body.retryAfterSeconds != null) verdict.retryAfterSeconds = body.retryAfterSeconds;
    return verdict;
  }

  const err = new Error(t('ai-assistant.chat.http-error', { status: response.status }));
  err.httpStatus = response.status;
  throw err;
};

// Timers of the polls in flight, by tracking id, so that a cancel can stop the poll it belongs to.
const activePolls = new Map();

/**
 * Stops the scheduled poll of a request, if any. Cancelling a request calls this before telling
 * the server, so that no further status GET goes out for a request the user has given up on.
 * @param {string} trackingId - The id `pollAiRequest` was given
 * @returns {boolean} Whether a poll was scheduled
 */
export const stopAiRequestPolling = trackingId => {
  const timer = activePolls.get(trackingId);
  if (timer === undefined) return false;
  clearTimeout(timer);
  activePolls.delete(trackingId);
  return true;
};

/**
 * Polls one AI request until the backend has spoken, on the shared ramp and budget.
 *
 * Resolves with the terminal status body — `{ result }`, `{ error }` or `{ status: 'cancelled' }` —
 * and leaves what to make of it to the caller, since that is where the three field services differ.
 * Rejects with the error of a failed poll (see `fetchAiStatus`), or, once the budget is spent, with
 * an `Error('Request timed out')` marked `isTimeout` after `onGiveUp` has run.
 *
 * The wait is accumulated from the delays scheduled rather than measured off the clock: the
 * schedule is then the same whatever the page was doing between two polls, and the tests can step
 * through it with fake timers. The first poll goes out at once.
 *
 * @param {Object} options
 * @param {string} options.requestId - Id of the request to poll
 * @param {string} options.statusUrl - Status endpoint; the id is appended to it
 * @param {string} [options.trackingId] - Key for `stopAiRequestPolling` (default: the request id)
 * @param {number} [options.waitMs] - Budget in ms (default: `AI_REQUEST_WAIT_MS`)
 * @param {Function} [options.onProgress] - Receives the `progress` of every processing status
 * @param {Function} [options.onGiveUp] - Runs when the budget is spent, before the rejection —
 *   the services cancel the request here, so that it does not go on burning tokens on an answer
 *   nobody is left to collect
 * @returns {Promise<Object>} The terminal status body
 */
export const pollAiRequest = ({ requestId, statusUrl, trackingId = requestId, waitMs = AI_REQUEST_WAIT_MS, onProgress, onGiveUp }) =>
  new Promise((resolve, reject) => {
    let waitedMs = 0;
    const url = `${statusUrl}/${encodeURIComponent(requestId)}`;

    const finish = () => activePolls.delete(trackingId);

    const schedule = () => {
      const delay = getAiPollDelay(waitedMs);
      waitedMs += delay;
      activePolls.set(trackingId, setTimeout(poll, delay));
    };

    const poll = async () => {
      if (waitedMs >= waitMs) {
        finish();
        onGiveUp?.();
        const timedOut = new Error('Request timed out');
        timedOut.isTimeout = true;
        reject(timedOut);
        return;
      }

      try {
        const data = await fetchAiStatus(url);

        if (data.result || data.error || data.status === 'cancelled') {
          finish();
          resolve(data);
          return;
        }

        if (data.status === 'processing' || data.status === 'pending') {
          if (data.progress) {
            onProgress?.(data.progress);
          }
          schedule();
          return;
        }

        // Anything else is not a verdict — keep asking rather than guess.
        console.warn('AI request polling: unknown status', data.status, 'after', waitedMs, 'ms');
        schedule();
      } catch (error) {
        finish();
        reject(error);
      }
    };

    poll();
  });
