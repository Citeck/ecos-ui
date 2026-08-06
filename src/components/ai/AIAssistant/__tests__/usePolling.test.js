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

    expect(onError).toHaveBeenCalledWith('Network error', { requestLost: false });
    expect(result.current.isPolling).toBe(false);
    consoleSpy.mockRestore();
  });

  // D-B-7: a response matching none of the known shapes used to schedule no next poll AND call no
  // callback — polling died silently while the card kept spinning with a blocked input forever.
  it('reports an error instead of dying silently on an unknown response shape', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    fetchStatus.mockResolvedValue({ status: 'queued' });
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onError).toHaveBeenCalledWith('ai-assistant.chat.polling-error');
    expect(result.current.isPolling).toBe(false);
    expect(result.current.activeRequestId).toBeNull();

    // And it really stopped: no further polls are scheduled
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(fetchStatus).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it('forwards the requestLost flag so the chat can explain a lost request', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const lost = new Error('request is lost');
    lost.requestLost = true;
    fetchStatus.mockRejectedValue(lost);
    const { result } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onError).toHaveBeenCalledWith('request is lost', { requestLost: true });
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

  it('gives up with onError after maxAttempts of continuous processing (watchdog)', async () => {
    // A request stuck in "processing" forever (e.g. after a transient backend 500) must not hang
    // the spinner indefinitely — the watchdog stops polling and surfaces a timeout error.
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling({ maxAttempts: 3 });

    act(() => {
      result.current.startPolling('req-1');
    });

    // 3 processing polls → watchdog trips on the 3rd
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.isPolling).toBe(false);
    expect(result.current.activeRequestId).toBeNull();

    // No further polling after giving up
    fetchStatus.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(fetchStatus).not.toHaveBeenCalled();
  });

  it('resets the attempt counter on a fresh startPolling', async () => {
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling({ maxAttempts: 3 });

    act(() => {
      result.current.startPolling('req-1');
    });
    // Two processing polls (below the cap)
    for (let i = 0; i < 2; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(onError).not.toHaveBeenCalled();

    // Restart — counter must reset so the watchdog doesn't trip prematurely
    act(() => {
      result.current.startPolling('req-2');
    });
    for (let i = 0; i < 2; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isPolling).toBe(true);
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
