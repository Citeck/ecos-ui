import { useState, useRef, useCallback, useEffect } from 'react';
import { POLLING_INTERVAL } from '../constants';

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

  const poll = useCallback(async (requestId, generation) => {
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
        pollingTimerRef.current = setTimeout(() => poll(requestId, generation), pollingInterval);
      }

    } catch (error) {
      if (!isMountedRef.current || generation !== generationRef.current) return;

      console.error('Error polling request status:', error);
      pollingTimerRef.current = null;
      setActiveRequestId(null);
      setIsPolling(false);
      onError?.(error.message || 'Произошла ошибка при получении результата');
    }
  }, [fetchStatus, onResult, onError, onCancelled, onProgress, pollingInterval]);

  const startPolling = useCallback((requestId) => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
    }
    const generation = ++generationRef.current;
    setActiveRequestId(requestId);
    setIsPolling(true);
    pollingTimerRef.current = setTimeout(() => poll(requestId, generation), pollingInterval);
  }, [poll, pollingInterval]);

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
