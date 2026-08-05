import { useState, useRef, useCallback, useEffect } from 'react';

import { POLLING_INTERVAL, POLLING_MAX_ATTEMPTS } from '@/components/ai/AIAssistant/constants';
import { t } from '@/helpers/export/util';

/**
 * Generic polling hook for async request status checking
 * @param {Object} options - Configuration options
 * @param {number} options.pollingInterval - Interval between polls in ms (default: 1000)
 * @param {Function} options.fetchStatus - Async function to fetch status, receives requestId
 * @param {Function} options.onResult - Callback when result is received
 * @param {Function} options.onError - Callback when error occurs
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

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, []);

  const poll = useCallback(
    async (requestId, generation) => {
      if (!isMountedRef.current || !fetchStatus) return;

      try {
        const data = await fetchStatus(requestId);

        if (!isMountedRef.current || generation !== generationRef.current) return;

        if (data.result) {
          // Request completed successfully
          pollingTimerRef.current = null;
          setActiveRequestId(null);
          setIsPolling(false);
          onResult?.(data.result);
        } else if (data.error) {
          // Request failed with error
          pollingTimerRef.current = null;
          setActiveRequestId(null);
          setIsPolling(false);
          onError?.(data.error);
        } else if (data.status === 'cancelled') {
          // Request was cancelled
          pollingTimerRef.current = null;
          setActiveRequestId(null);
          setIsPolling(false);
          onCancelled?.();
        } else if (data.status === 'processing') {
          // Still processing - report progress and continue polling
          if (data.progress) {
            onProgress?.(data.progress);
          }
          // Watchdog: a request that never leaves "processing" (e.g. after a transient backend 500)
          // would otherwise poll forever and hang the typing indicator. Give up after the cap and
          // surface a timeout error so the chat resets instead of spinning silently.
          attemptsRef.current += 1;
          if (attemptsRef.current >= maxAttempts) {
            pollingTimerRef.current = null;
            setActiveRequestId(null);
            setIsPolling(false);
            onError?.(t('ai-assistant.chat.polling-timeout'));
            return;
          }
          pollingTimerRef.current = setTimeout(() => poll(requestId, generation), pollingInterval);
        } else {
          // Any other shape — an unknown status, an empty body, a gateway error page — used to fall
          // through every branch above: no next poll was scheduled and no callback fired. Polling
          // died silently while the card kept spinning with a live "Cancel" button and a blocked
          // input, forever. Treat it as a failure instead of going quiet (D-B-7).
          console.error('Unexpected polling response shape:', data);
          pollingTimerRef.current = null;
          setActiveRequestId(null);
          setIsPolling(false);
          onError?.(t('ai-assistant.chat.polling-error'));
        }
      } catch (error) {
        if (!isMountedRef.current || generation !== generationRef.current) return;

        console.error('Error polling request status:', error);
        pollingTimerRef.current = null;
        setActiveRequestId(null);
        setIsPolling(false);
        // `requestLost` marks a request the server no longer knows, so the chat can explain that
        // instead of showing a transport error the user can do nothing about.
        onError?.(error.message || t('ai-assistant.chat.polling-error'), { requestLost: !!error.requestLost });
      }
    },
    [fetchStatus, onResult, onError, onCancelled, onProgress, pollingInterval, maxAttempts]
  );

  const startPolling = useCallback(
    requestId => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
      const generation = ++generationRef.current;
      attemptsRef.current = 0;
      setActiveRequestId(requestId);
      setIsPolling(true);
      pollingTimerRef.current = setTimeout(() => poll(requestId, generation), pollingInterval);
    },
    [poll, pollingInterval]
  );

  const stopPolling = useCallback(() => {
    generationRef.current++;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setActiveRequestId(null);
    setIsPolling(false);
  }, []);

  return {
    startPolling,
    stopPolling,
    isPolling,
    activeRequestId
  };
};

export default usePolling;
