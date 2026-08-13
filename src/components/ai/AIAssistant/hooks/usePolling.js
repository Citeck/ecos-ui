import { useState, useRef, useCallback, useEffect } from 'react';

import { POLLING_INTERVAL, POLLING_MAX_ATTEMPTS } from '@/components/ai/AIAssistant/constants';
import { t } from '@/helpers/export/util';

/**
 * Generic polling hook for async request status checking
 * @param {Object} options - Configuration options
 * @param {number} options.pollingInterval - Interval between polls in ms (default: 1000)
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
    maxAttempts = POLLING_MAX_ATTEMPTS,
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
  const attemptsRef = useRef(0);
  // The poll that is currently scheduled, as `{ requestId, generation }` — null whenever nothing
  // should be running. It is what lets the mount effect put back a timer its own cleanup cleared.
  const pendingPollRef = useRef(null);
  // Always the latest `poll`. The mount effect is declared before `poll` and must not close over it,
  // or a re-armed poll would keep calling the first render's `fetchStatus`/`onResult`.
  const pollRef = useRef(null);

  // Single place where a timer is armed, so the scheduled timer and the record of what it is polling
  // can never drift apart.
  const schedulePoll = useCallback(
    (requestId, generation) => {
      pendingPollRef.current = { requestId, generation };
      pollingTimerRef.current = setTimeout(() => pollRef.current?.(requestId, generation), pollingInterval);
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
    async (requestId, generation) => {
      if (!isMountedRef.current || !fetchStatus) return;

      try {
        const data = await fetchStatus(requestId);

        if (!isMountedRef.current || generation !== generationRef.current) return;

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
          // would otherwise poll forever and hang the typing indicator. Give up after the cap and
          // surface a timeout error so the chat resets instead of spinning silently.
          // `requestAlive`: the cap is this client's own patience (10 min), not the backend's — it
          // kills a request only after 30 min and keeps the result for an hour more. Saying the
          // request is over here would throw away the id, and with it the only way to pick the
          // answer up after a reload.
          attemptsRef.current += 1;
          if (attemptsRef.current >= maxAttempts) {
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
    [fetchStatus, onResult, onError, onCancelled, onProgress, maxAttempts, schedulePoll, finishPolling]
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
      attemptsRef.current = 0;
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
