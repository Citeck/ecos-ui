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

    // The only error branch that is terminal for the request: the backend decided its outcome, so
    // the caller may retire the stored requestId
    expect(onError).toHaveBeenCalledWith('something went wrong', { requestAlive: false });
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
    fetchStatus.mockResolvedValueOnce({ status: 'processing', progress }).mockResolvedValueOnce({ result: { message: 'done' } });

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

    // A transport failure says nothing about the request, which keeps running server-side — the
    // caller has to be able to tell it apart from a request that is actually over (D-B-14)
    expect(onError).toHaveBeenCalledWith('Network error', { requestLost: false, requestAlive: true });
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

    expect(onError).toHaveBeenCalledWith('ai-assistant.chat.polling-error', { requestAlive: true });
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

    // A request the server no longer knows is over for good — unlike the transport failure above,
    // this one lets the caller retire the stored id
    expect(onError).toHaveBeenCalledWith('request is lost', { requestLost: true, requestAlive: false });
    consoleSpy.mockRestore();
  });

  it('ignores stale responses after generation changes (stopPolling)', async () => {
    let resolveFirst;
    fetchStatus.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    );

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

  it('gives up with onError once the waiting budget is spent (watchdog)', async () => {
    // A request stuck in "processing" forever (e.g. after a transient backend 500) must not hang
    // the spinner indefinitely — the watchdog stops polling and surfaces a timeout error.
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling({ timeoutMs: 3000 });

    act(() => {
      result.current.startPolling('req-1');
    });

    // 3 processing polls → three seconds of the budget gone, watchdog trips on the 3rd
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(onError).toHaveBeenCalledTimes(1);
    // The cap is this client's own patience, not the backend's: the request goes on running, so the
    // caller must keep its id and stay able to resume the poll after a reload (D-B-14)
    expect(onError).toHaveBeenCalledWith('ai-assistant.chat.polling-timeout', { requestAlive: true });
    expect(result.current.isPolling).toBe(false);
    expect(result.current.activeRequestId).toBeNull();

    // No further polling after giving up
    fetchStatus.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(fetchStatus).not.toHaveBeenCalled();
  });

  it('gives every fresh startPolling the full waiting budget', async () => {
    // D-B2d-CHAT-POLL-BUDGET: on the stand the first question of a session waited two minutes and
    // every later one in the same page eight to fifteen seconds, so a config agent — which thinks
    // for one to ten minutes — never reached its answer without a page reload in between.
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result } = renderPolling({ timeoutMs: 3000 });

    act(() => {
      result.current.startPolling('req-1');
    });
    // Spend the whole budget of the first request
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(onError).toHaveBeenCalledTimes(1);

    // The second request must wait just as long as the first did
    act(() => {
      result.current.startPolling('req-2');
    });
    for (let i = 0; i < 2; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.isPolling).toBe(true);
  });

  it('measures the budget in wall-clock time, not in polls', async () => {
    // The budget used to be a count of polls (600, meant as 600 × 1s). Anything that polls more
    // often than once per interval — a duplicated chain, a retry — spent the user's patience
    // without a second of it passing: 600 polls burned in two minutes on the stand, and later in
    // eight seconds. The same arithmetic runs the other way when the server is slow: here each
    // status call takes four seconds, so ten polls — the count that a ten-second budget buys at the
    // normal interval — would keep the user waiting fifty seconds instead of ten. What is promised
    // is a length of waiting, so that is what is measured.
    fetchStatus.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve({ status: 'processing' }), 4000);
        })
    );
    const { result } = renderPolling({ timeoutMs: 10000 });

    act(() => {
      result.current.startPolling('req-1');
    });

    // 11 s of clock: poll 1 runs 1s→5s, poll 2 runs 6s→10s, and the budget is spent as it returns
    for (let i = 0; i < 11; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(fetchStatus).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith('ai-assistant.chat.polling-timeout', { requestAlive: true });
    expect(result.current.isPolling).toBe(false);
  });

  it('keeps a single poll chain when a poll outlives the timer that armed it', async () => {
    // The mount effect puts back a timer its own cleanup cleared, and it does so from
    // `pendingPollRef` — which is still set while a poll is waiting for `fetchStatus`. Before the
    // chain id, the restored timer and the returning poll each scheduled a successor, so one
    // request came to be polled by two chains at once; every repetition doubled the load, and on
    // the stand the panel reached 13 066 requests to the gateway in a single session.
    let resolveFetch;
    fetchStatus.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve;
        })
    );

    const { result, rerender } = renderHook(
      ({ interval }) => usePolling({ fetchStatus, onResult, onError, onCancelled, onProgress, pollingInterval: interval }),
      {
        initialProps: { interval: 1000 }
      }
    );

    act(() => {
      result.current.startPolling('req-1');
    });

    // The first poll fires and hangs on the server
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    // The mount effect re-runs while that poll is in the air and re-arms the timer
    rerender({ interval: 1001 });

    // The hung poll now answers: it must not schedule a successor of its own
    await act(async () => {
      resolveFetch({ status: 'processing' });
    });

    fetchStatus.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(1001);
    });

    // Exactly one chain is walking the request — not two
    expect(fetchStatus).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    fetchStatus.mockResolvedValue({ status: 'processing' });
    const { result, unmount } = renderPolling();

    act(() => {
      result.current.startPolling('req-1');
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // The armed timer has to be gone, not merely harmless: a poll surviving the unmount keeps
    // asking the backend about a request whose chat is no longer on screen, and its callbacks
    // reach into an unmounted tree. Advancing five intervals must produce no request at all.
    expect(fetchStatus).not.toHaveBeenCalled();
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
