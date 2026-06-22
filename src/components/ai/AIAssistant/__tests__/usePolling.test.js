import { renderHook, act } from '@testing-library/react';
import usePolling from '../hooks/usePolling';

jest.useFakeTimers();

describe('usePolling', () => {
  let fetchStatus;
  let onResult;
  let onError;
  let onCancelled;
  let onProgress;

  beforeEach(() => {
    fetchStatus = jest.fn();
    onResult = jest.fn();
    onError = jest.fn();
    onCancelled = jest.fn();
    onProgress = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const renderPolling = (overrides = {}) =>
    renderHook(() =>
      usePolling({
        fetchStatus,
        onResult,
        onError,
        onCancelled,
        onProgress,
        pollingInterval: 1000,
        ...overrides
      })
    );

  it('initializes with isPolling=false and activeRequestId=null', () => {
    const { result } = renderPolling();
    expect(result.current.isPolling).toBe(false);
    expect(result.current.activeRequestId).toBeNull();
  });

  it('startPolling sets isPolling and activeRequestId', () => {
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    expect(result.current.isPolling).toBe(true);
    expect(result.current.activeRequestId).toBe('req-1');
  });

  it('calls fetchStatus after polling interval', async () => {
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(fetchStatus).toHaveBeenCalledWith('req-1');
  });

  it('calls onResult and stops polling when result is received', async () => {
    const resultData = { message: 'done' };
    fetchStatus.mockResolvedValue({ result: resultData });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onResult).toHaveBeenCalledWith(resultData);
    expect(result.current.isPolling).toBe(false);
    expect(result.current.activeRequestId).toBeNull();
  });

  it('calls onError and stops polling when error is received', async () => {
    fetchStatus.mockResolvedValue({ error: 'something went wrong' });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onError).toHaveBeenCalledWith('something went wrong');
    expect(result.current.isPolling).toBe(false);
  });

  it('calls onCancelled and stops polling when status is cancelled', async () => {
    fetchStatus.mockResolvedValue({ status: 'cancelled' });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onCancelled).toHaveBeenCalled();
    expect(result.current.isPolling).toBe(false);
  });

  it('calls onProgress and continues polling when processing with progress', async () => {
    const progress = { stage: 'GENERATING', progress: 50 };
    fetchStatus
      .mockResolvedValueOnce({ status: 'processing', progress })
      .mockResolvedValueOnce({ result: { message: 'done' } });

    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    // First poll — processing
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onProgress).toHaveBeenCalledWith(progress);
    expect(result.current.isPolling).toBe(true);

    // Second poll — result
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onResult).toHaveBeenCalled();
    expect(result.current.isPolling).toBe(false);
  });

  it('stopPolling clears timer and resets state', async () => {
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    act(() => {
      result.current.stopPolling();
    });

    expect(result.current.isPolling).toBe(false);
    expect(result.current.activeRequestId).toBeNull();

    // Advancing time should not trigger any fetch
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(fetchStatus).not.toHaveBeenCalled();
  });

  it('handles fetch error by calling onError', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    fetchStatus.mockRejectedValue(new Error('Network error'));
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onError).toHaveBeenCalledWith('Network error');
    expect(result.current.isPolling).toBe(false);
    consoleSpy.mockRestore();
  });

  it('ignores stale responses after generation changes (stopPolling)', async () => {
    let resolveFirst;
    fetchStatus.mockImplementation(() => new Promise(resolve => { resolveFirst = resolve; }));

    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Stop polling before the first fetch resolves
    act(() => {
      result.current.stopPolling();
    });

    // Resolve the stale request
    await act(async () => {
      resolveFirst({ result: { message: 'stale' } });
    });

    // Should NOT call onResult because generation changed
    expect(onResult).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount', () => {
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result, unmount } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    unmount();

    // No error should be thrown after unmount
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  it('startPolling replaces previous polling session', async () => {
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    act(() => {
      result.current.startPolling('req-2');
    });

    expect(result.current.activeRequestId).toBe('req-2');

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(fetchStatus).toHaveBeenCalledWith('req-2');
  });
});
