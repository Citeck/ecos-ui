import { useState, useRef, useCallback, useEffect } from 'react';

import { POLLING_INTERVAL, POLLING_TIMEOUT_MS } from '@/components/ai/AIAssistant/constants';
import { t } from '@/helpers/export/util';

/**
 * Generic polling hook for async request status checking
 * @param {Object} options - Configuration options
 * @param {number} options.pollingInterval - Interval between polls in ms (default: 1000)
 * @param {number} options.timeoutMs - How long one request may stay in "processing" before polling
 *   gives up, in wall-clock ms (default: 10 min). Reset by every `startPolling`
 * @param {Function} options.fetchStatus - Async function to fetch status, receives requestId
 * @param {Function} options.onResult - Callback when result is received
 * @param {Function} options.onError - Callback when the request fails or polling gives up. Receives
 *   `(message, { requestLost, requestAlive })`: `requestLost` marks a request the server no longer
 *   knows, `requestAlive` marks a failure of the polling itself — the request behind it was never
 *   reported finished and may still be running server-side
 * @param {Function} options.onCancelled - Callback when request is cancelled
 * @param {Function} options.onProgress - Callback for progress updates during processing
 * @returns {Object} { startPolling, stopPolling, isPolling, activeRequestId }
 */
const usePolling = (options = {}) => {
  const {
    pollingInterval = POLLING_INTERVAL,
    timeoutMs = POLLING_TIMEOUT_MS,
    fetchStatus,
    onResult,
    onError,
    onCancelled,
    onProgress
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const pollingTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const generationRef = useRef(0);
  // When the wait on the current request started. The watchdog below measures the user's patience
  // against this and not against a count of polls (D-B2d-CHAT-POLL-BUDGET, see the comment on
  // `POLLING_TIMEOUT_MS`).
  const startedAtRef = useRef(0);
  // Which scheduled poll is the live one. `generationRef` marks the request; this marks the single
  // chain of polls allowed to be walking it. Anything that arms a timer takes the next number, so
  // a poll returning from a `fetchStatus` that outlived its own chain — its timer put back by the
  // mount effect below while the answer was in the air — finds its number stale and stops instead
  // of scheduling a successor beside the live one. Without it two chains poll the same request in
  // parallel, and every duplication doubles the load on the gateway.
  const chainIdRef = useRef(0);
  // The poll that is currently scheduled, as `{ requestId, generation, chainId }` — null whenever
  // nothing should be running. It is what lets the mount effect put back a timer its own cleanup
  // cleared.
  const pendingPollRef = useRef(null);
  // Always the latest `poll`. The mount effect is declared before `poll` and must not close over it,
  // or a re-armed poll would keep calling the first render's `fetchStatus`/`onResult`.
  const pollRef = useRef(null);

  // Single place where a timer is armed, so the scheduled timer and the record of what it is polling
  // can never drift apart.
  const schedulePoll = useCallback(
    (requestId, generation) => {
      const chainId = ++chainIdRef.current;
      pendingPollRef.current = { requestId, generation, chainId };
      pollingTimerRef.current = setTimeout(() => pollRef.current?.(requestId, generation, chainId), pollingInterval);
    },
    [pollingInterval]
  );

  // Single place where polling ends, for the same reason: a terminal branch that forgot to drop
  // `pendingPollRef` would let the mount effect below resurrect a request that is already done.
  const finishPolling = useCallback(() => {
    pollingTimerRef.current = null;
    pendingPollRef.current = null;
    setActiveRequestId(null);
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    // React StrictMode (dev, and the dev-stage build) runs mount effects setup → cleanup → setup,
    // and the cleanup below clears the scheduled poll. Nothing else re-arms it: a caller that
    // started polling during the first setup — the D-B-14 restore does exactly that — is latched
    // against repeating itself, so the request would go on running server-side with the card
    // spinning and nobody collecting the result. Put back the timer this cleanup took away.
    const pending = pendingPollRef.current;
    if (pending && !pollingTimerRef.current) {
      schedulePoll(pending.requestId, pending.generation);
    }
    return () => {
      isMountedRef.current = false;
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [schedulePoll]);

  const poll = useCallback(
    async (requestId, generation, chainId) => {
      if (!isMountedRef.current || !fetchStatus || chainId !== chainIdRef.current) return;

      try {
        const data = await fetchStatus(requestId);

        // Checked again on the way back, not only on the way in: the chain can be superseded while
        // the answer is in the air, and a poll that goes on to schedule its successor from there is
        // exactly how two chains come to walk one request.
        if (!isMountedRef.current || generation !== generationRef.current || chainId !== chainIdRef.current) return;

        if (data.result) {
          // Request completed successfully
          finishPolling();
          onResult?.(data.result);
        } else if (data.error) {
          // Request failed with error. This is the one error branch that is terminal for the request
          // itself: the backend has decided its outcome, so there is nothing left to come back for.
          finishPolling();
          onError?.(data.error, { requestAlive: false });
        } else if (data.status === 'cancelled') {
          // Request was cancelled
          finishPolling();
          onCancelled?.();
        } else if (data.status === 'processing') {
          // Still processing - report progress and continue polling
          if (data.progress) {
            onProgress?.(data.progress);
          }
          // Watchdog: a request that never leaves "processing" (e.g. after a transient backend 500)
          // would otherwise poll forever and hang the typing indicator. Give up once the wait is
          // spent and surface a timeout error so the chat resets instead of spinning silently.
          // `requestAlive`: the budget is this client's own patience (10 min), not the backend's —
          // it kills a request only after 30 min and keeps the result for an hour more. Saying the
          // request is over here would throw away the id, and with it the only way to pick the
          // answer up after a reload.
          //
          // Measured against the clock rather than counted in polls: what the user is promised is
          // ten minutes of waiting, and a promise counted in polls is spent by any poll at all —
          // the panel gave up eight seconds into a request that was answered normally over HTTP
          // (D-B2d-CHAT-POLL-BUDGET).
          if (Date.now() - startedAtRef.current >= timeoutMs) {
            finishPolling();
            onError?.(t('ai-assistant.chat.polling-timeout'), { requestAlive: true });
            return;
          }
          schedulePoll(requestId, generation);
        } else {
          // Any other shape — an unknown status, an empty body, a gateway error page — used to fall
          // through every branch above: no next poll was scheduled and no callback fired. Polling
          // died silently while the card kept spinning with a live "Cancel" button and a blocked
          // input, forever. Treat it as a failure instead of going quiet (D-B-7).
          console.error('Unexpected polling response shape:', data);
          finishPolling();
          // The body says nothing about the request being over — an unparseable answer is a failure
          // of this poll, not a verdict on the request, so it stays resumable.
          onError?.(t('ai-assistant.chat.polling-error'), { requestAlive: true });
        }
      } catch (error) {
        if (!isMountedRef.current || generation !== generationRef.current) return;

        console.error('Error polling request status:', error);
        finishPolling();
        // `requestLost` marks a request the server no longer knows, so the chat can explain that
        // instead of showing a transport error the user can do nothing about. Anything else here is
        // a transport failure — a dropped connection, a gateway 502, a sleeping laptop — and there
        // are no retries: one such poll ends the whole thing. The request behind it keeps running,
        // so it is reported as still alive and the stored id survives for a later reload to resume.
        onError?.(error.message || t('ai-assistant.chat.polling-error'), {
          requestLost: !!error.requestLost,
          requestAlive: !error.requestLost
        });
      }
    },
    [fetchStatus, onResult, onError, onCancelled, onProgress, timeoutMs, schedulePoll, finishPolling]
  );

  // Published from an effect, not from the render body: React may build a render and then throw it
  // away (an interrupted transition, `useDeferredValue`), and a plain assignment would leave that
  // discarded render's `poll` — closed over state that was never committed — as the function the
  // next timer calls. The timers are a second apart at the very least, so an effect is always in
  // time; the very first arming goes through the mount effect below, which runs later still.
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const startPolling = useCallback(
    requestId => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
      const generation = ++generationRef.current;
      // Every request gets the full wait of its own. The panel gave up on the second question of a
      // session in seconds, and reloading the page was the only way to get a first-question-length
      // wait back (D-B2d-CHAT-POLL-BUDGET).
      startedAtRef.current = Date.now();
      setActiveRequestId(requestId);
      setIsPolling(true);
      schedulePoll(requestId, generation);
    },
    [schedulePoll]
  );

  const stopPolling = useCallback(() => {
    generationRef.current++;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
    }
    finishPolling();
  }, [finishPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling,
    activeRequestId
  };
};

export default usePolling;
