import * as transport from '../transport';

jest.mock('../transport');

import { DEFAULT_URL_BASE, FileStatuses, UploadError, __resetUploadConfigCache, getUploadConfig, uploadContent } from '../index';

function makeFile(size, { name = 'file.bin', type = 'application/octet-stream' } = {}) {
  return new File([new Uint8Array(size)], name, { type });
}

function jsonResponse(status, body) {
  return { xhr: {}, promise: Promise.resolve({ status, body, xhr: {} }) };
}

function networkErrorResponse() {
  return { xhr: { abort: jest.fn() }, promise: Promise.reject({ networkError: true, message: 'boom' }) };
}

/**
 * A minimal fake server: tracks one upload session's confirmed offset and
 * responds to requestJson/uploadChunk calls the way the real endpoint would,
 * with hooks to inject the specific failure modes under test.
 */
function installFakeServer({
  urlBase = DEFAULT_URL_BASE,
  configBody = { chunkingThreshold: 5, maxSingleUploadSize: 1000 },
  initResponses, // array of bodies, consumed in order across init calls (re-init on 410)
  chunkSize,
  size,
  chunkHandler, // optional (offset, len) => 'ok' | 'conflict-empty' | 'gone' | 'network' | 'unauthorized' | {conflict: offset} | number(status)
  completeHandler, // optional () => 'ok' | 'network' | { conflict: offset } | 'conflict-empty' | 'gone'
  statusHandler // optional (callIndex) => 'ok' | 'network' | number(status) — drives GET /upload-session/{id}
} = {}) {
  let confirmedOffset = 0;
  let uploadId = null;
  let initCallCount = 0;
  const deleteCalls = [];
  const chunkCalls = [];
  let completed = false;
  let statusCalls = 0;
  let entityRef = 'workspace://SpacesStore/generated-ref';

  transport.requestJson.mockImplementation(({ url, method }) => {
    if (url === `${urlBase}/upload-config`) {
      return jsonResponse(200, configBody);
    }
    if (url === `${urlBase}/upload-session` && method === 'POST') {
      const body = initResponses[Math.min(initCallCount, initResponses.length - 1)];
      initCallCount += 1;
      if (body.supported !== false) {
        uploadId = body.uploadId;
        confirmedOffset = 0;
        completed = false;
      }
      return jsonResponse(200, body);
    }
    if (url === `${urlBase}/upload-session/${uploadId}` && method === 'GET') {
      statusCalls += 1;
      const outcome = statusHandler ? statusHandler(statusCalls) : 'ok';
      if (outcome === 'network') {
        return networkErrorResponse();
      }
      if (typeof outcome === 'number') {
        return jsonResponse(outcome, undefined);
      }
      return jsonResponse(200, {
        status: completed ? 'DONE' : 'UPLOADING',
        offset: confirmedOffset,
        size,
        chunkSize,
        entityRef: completed ? entityRef : undefined
      });
    }
    if (url === `${urlBase}/upload-session/${uploadId}/complete` && method === 'POST') {
      const outcome = completeHandler ? completeHandler() : 'ok';
      if (outcome === 'network') {
        return networkErrorResponse();
      }
      if (outcome === 'gone') {
        return jsonResponse(410, undefined);
      }
      if (outcome === 'conflict-empty') {
        // ContentUploadCompletionInProgressException → 409 with NO body (ResponseEntity<Void>).
        return jsonResponse(409, undefined);
      }
      if (outcome && typeof outcome === 'object' && 'conflict' in outcome) {
        return jsonResponse(409, { offset: outcome.conflict, size });
      }
      completed = true;
      return jsonResponse(200, { entityRef });
    }
    if (url === `${urlBase}/upload-session/${uploadId}` && method === 'DELETE') {
      deleteCalls.push(uploadId);
      return jsonResponse(204, undefined);
    }
    throw new Error(`Unhandled requestJson call: ${method} ${url}`);
  });

  transport.uploadChunk.mockImplementation(({ url, blob, onUploadProgress }) => {
    const match = url.match(/\/upload-session\/([^/]+)\/chunk\?offset=(\d+)$/);
    const offset = Number(match[2]);
    chunkCalls.push({ offset, len: blob.size });

    const outcome = chunkHandler ? chunkHandler(offset, blob.size) : 'ok';
    const xhr = { abort: jest.fn() };

    if (outcome === 'network') {
      return { xhr, promise: Promise.reject({ networkError: true, message: 'boom' }) };
    }

    const promise = Promise.resolve().then(() => {
      if (onUploadProgress) {
        onUploadProgress(blob.size, blob.size);
      }
      if (outcome === 'gone') {
        return { status: 410, body: undefined, xhr };
      }
      if (outcome === 'unauthorized') {
        return { status: 401, body: undefined, xhr };
      }
      if (typeof outcome === 'number') {
        return { status: outcome, body: undefined, xhr };
      }
      if (outcome === 'conflict-empty') {
        // ContentUploadCompletionInProgressException → 409 with NO body (ResponseEntity<Void>).
        return { status: 409, body: undefined, xhr };
      }
      if (outcome && typeof outcome === 'object' && 'conflict' in outcome) {
        return { status: 409, body: { offset: outcome.conflict }, xhr };
      }
      confirmedOffset = Math.max(confirmedOffset, offset + blob.size);
      return { status: 200, body: { offset: confirmedOffset }, xhr };
    });

    return { xhr, promise };
  });

  return {
    deleteCalls,
    chunkCalls,
    getUploadId: () => uploadId,
    getConfirmedOffset: () => confirmedOffset,
    getStatusCalls: () => statusCalls,
    setConfirmedOffset: value => {
      confirmedOffset = value;
    }
  };
}

describe('chunkedUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    __resetUploadConfigCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('slices the file into correctly-sized/offset chunks and uploads them in order', async () => {
    const size = 25;
    const chunkSize = 10;
    const file = makeFile(size);
    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-1', chunkSize }]
    });

    const result = await uploadContent(file, { urlBase: DEFAULT_URL_BASE });

    expect(server.chunkCalls).toEqual([
      { offset: 0, len: 10 },
      { offset: 10, len: 10 },
      { offset: 20, len: 5 }
    ]);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  it('falls back to the single-shot path when file.size is below chunkingThreshold', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 1000, maxSingleUploadSize: 2000 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });

    let capturedFormData;
    transport.uploadFormData.mockImplementation(({ formData, onUploadProgress }) => {
      capturedFormData = formData;
      const xhr = { abort: jest.fn() };
      const promise = Promise.resolve().then(() => {
        onUploadProgress(3, 3);
        return { status: 200, body: { entityRef: 'single-shot-ref' }, xhr };
      });
      return { xhr, promise };
    });

    const events = [];
    const result = await uploadContent(file, {
      ecosType: 'my-type',
      handleProgress: state => events.push(state.status)
    });

    expect(transport.requestJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: `${DEFAULT_URL_BASE}/upload-session` })
    );
    expect(capturedFormData.get('file')).toBeInstanceOf(File);
    expect(capturedFormData.get('name')).toBe('small.txt');
    expect(capturedFormData.get('ecosType')).toBe('my-type');
    expect(result).toEqual({ entityRef: 'single-shot-ref' });
    expect(events).toEqual([FileStatuses.PREPARING, FileStatuses.UPLOADING, FileStatuses.HEADERS_RECEIVED, FileStatuses.DONE]);
  });

  it('falls back silently to single-shot when supported:false and file.size <= the RESPONSE maxSingleUploadSize (not the cached config)', async () => {
    const file = makeFile(50);
    transport.requestJson.mockImplementation(({ url, method }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        // Cache says chunking kicks in at 10 bytes and only 5 bytes are allowed single-shot —
        // the init response below must win instead.
        return jsonResponse(200, { chunkingThreshold: 10, maxSingleUploadSize: 5 });
      }
      if (url === `${DEFAULT_URL_BASE}/upload-session` && method === 'POST') {
        return jsonResponse(200, { supported: false, reason: 'storage-not-supported', maxSingleUploadSize: 100, maxFileSize: -1 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });
    transport.uploadFormData.mockImplementation(() => {
      const xhr = { abort: jest.fn() };
      const promise = Promise.resolve({ status: 200, body: { entityRef: 'fallback-ref' }, xhr });
      return { xhr, promise };
    });

    const result = await uploadContent(file, {});

    expect(result).toEqual({ entityRef: 'fallback-ref' });
    expect(transport.uploadFormData).toHaveBeenCalledTimes(1);
  });

  it('rejects with a chunked-upload-rejected error (passing maxFileSize through untouched, incl. -1) when the file exceeds maxSingleUploadSize', async () => {
    const file = makeFile(500);
    transport.requestJson.mockImplementation(({ url, method }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 10, maxSingleUploadSize: 999999 });
      }
      if (url === `${DEFAULT_URL_BASE}/upload-session` && method === 'POST') {
        return jsonResponse(200, { supported: false, reason: 'max-size-exceeded', maxSingleUploadSize: 100, maxFileSize: -1 });
      }
      throw new Error('unexpected call');
    });

    let caught;
    try {
      await uploadContent(file, {});
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(String(caught)).toContain('max-size-exceeded');
    expect(caught).toMatchObject({
      type: 'chunked-upload-rejected',
      reason: 'max-size-exceeded',
      maxSingleUploadSize: 100,
      maxFileSize: -1
    });
    expect(transport.uploadFormData).not.toHaveBeenCalled();
  });

  it('single-shot HTTP error emits ERROR_UPLOAD exactly once, with the raw server body as `response`, and rejects with that body', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 1000, maxSingleUploadSize: 2000 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });
    const serverBody = { message: 'file rejected', status: { description: 'bad type' } };
    transport.uploadFormData.mockImplementation(() => {
      const xhr = { abort: jest.fn() };
      const promise = Promise.resolve({ status: 415, body: serverBody, xhr });
      return { xhr, promise };
    });

    const events = [];
    let caught;
    try {
      await uploadContent(file, {
        handleProgress: (state, facade) => events.push({ status: state.status, response: state.response, facade })
      });
    } catch (err) {
      caught = err;
    }

    // Rejection contract: a real Error, message from the server's own body.message, with
    // status/body preserved as own properties. A bare server body would stringify to
    // `[object Object]` in toasts that just join the rejections, e.g. sagaUploadFiles.
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(caught.message).toBe('file rejected');
    expect(String(caught)).toContain('file rejected');
    expect(caught).toMatchObject({ status: 415, body: serverBody });

    const errorEvents = events.filter(e => e.status === FileStatuses.ERROR_UPLOAD);
    expect(errorEvents).toHaveLength(1);
    // handleProgress's `response` is still the raw server body (unchanged, separate contract
    // from the rejected promise value — see this module's file header).
    expect(errorEvents[0].response).toEqual(serverBody);
    // Legacy ecosXhr.js never calls handleProgress from xhr.onerror — only one
    // terminal emission total, not ERROR_UPLOAD followed by anything else.
    expect(events[events.length - 1].status).toBe(FileStatuses.ERROR_UPLOAD);
  });

  it('single-shot network error emits EXCEPTION_UPLOAD exactly once and rejects with the raw error', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 1000, maxSingleUploadSize: 2000 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });
    transport.uploadFormData.mockImplementation(() => {
      const xhr = { abort: jest.fn() };
      const promise = Promise.reject({ networkError: true, message: 'boom' });
      return { xhr, promise };
    });

    const events = [];
    let caught;
    try {
      await uploadContent(file, { handleProgress: state => events.push(state.status) });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(caught.message).toBe('boom');
    expect(String(caught)).toContain('boom');
    expect(caught).toMatchObject({ networkError: true });

    expect(events.filter(s => s === FileStatuses.EXCEPTION_UPLOAD)).toHaveLength(1);
    expect(events.filter(s => s === FileStatuses.ERROR_UPLOAD)).toHaveLength(0);
    expect(events[events.length - 1]).toBe(FileStatuses.EXCEPTION_UPLOAD);
  });

  it('a chunked-path fatal error hands handleProgress the raw server body (same shape as the single-shot path), keeping HTTP status on the rejected value', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    const serverBody = { message: 'forbidden', status: { description: 'no access' } };

    installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-403', chunkSize }],
      chunkHandler: offset => (offset === 10 ? 403 : 'ok')
    });
    // installFakeServer's generic numeric-status branch sends `body: undefined` —
    // override just the chunk handler to also carry a realistic error body.
    transport.uploadChunk.mockImplementation(({ url, blob }) => {
      const match = url.match(/offset=(\d+)$/);
      const offset = Number(match[1]);
      const xhr = { abort: jest.fn() };
      if (offset === 10) {
        return { xhr, promise: Promise.resolve({ status: 403, body: serverBody, xhr }) };
      }
      return { xhr, promise: Promise.resolve({ status: 200, body: { offset: offset + blob.size }, xhr }) };
    });

    const events = [];
    const promise = uploadContent(file, { handleProgress: state => events.push({ status: state.status, response: state.response }) });
    promise.catch(() => {});

    let caught;
    try {
      await promise;
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(caught.message).toBe('forbidden');
    expect(String(caught)).toContain('forbidden');
    expect(caught).toMatchObject({ status: 403, body: serverBody });

    const errorEvents = events.filter(e => e.status === FileStatuses.ERROR_UPLOAD);
    expect(errorEvents).toHaveLength(1);
    // Same shape DropZone.jsx/AddModal.jsx already parse: response.message / response.status.description —
    // not {status: 403, body: {...}}. handleProgress's `response` stays the raw body, independent of the
    // rejected UploadError (see this module's file header).
    expect(errorEvents[0].response).toEqual(serverBody);
  });

  it('recovers from two network failures by resyncing via GET and continuing from the SERVER-confirmed offset', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let attempt = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-net', chunkSize }],
      chunkHandler: offset => {
        if (offset === 0) {
          attempt += 1;
          if (attempt <= 2) {
            return 'network';
          }
        }
        return 'ok';
      }
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(attempt).toBe(3);
    // Two failed attempts at offset 0, then a successful one, then the
    // remaining chunk — the module resyncs via GET after each failure and
    // resumes from the server-confirmed offset rather than inventing its own.
    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 0, 0, 10]);
    expect(server.getConfirmedOffset()).toBe(size);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  it('resynchronises on a 409 by continuing from the offset in the response body', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-409', chunkSize }],
      chunkHandler: offset => {
        // Server insists the *real* confirmed offset is 15, not what the
        // client's local bookkeeping (10) would send next.
        if (offset === 10) {
          return { conflict: 15 };
        }
        return 'ok';
      }
    });

    const result = await uploadContent(file, {});

    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 10, 15]);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  it('a 200 chunk response missing a numeric offset is treated as a fatal protocol error, not silently guessed', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);

    installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-badbody', chunkSize }]
    });
    transport.uploadChunk.mockImplementation(({ url, blob }) => {
      const xhr = { abort: jest.fn() };
      // Server contract guarantees {offset} in the body; simulate a violation.
      return { xhr, promise: Promise.resolve({ status: 200, body: {}, xhr }) };
    });

    await expect(uploadContent(file, {})).rejects.toBeDefined();
    expect(transport.uploadChunk).toHaveBeenCalledTimes(1);
  });

  it('401 with opts.onAuthError calls it and fails without waiting or resyncing', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);
    const onAuthError = jest.fn();

    installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-401a', chunkSize }],
      chunkHandler: () => 'unauthorized'
    });

    await expect(uploadContent(file, { onAuthError })).rejects.toBeDefined();
    expect(onAuthError).toHaveBeenCalledTimes(1);
    expect(transport.uploadChunk).toHaveBeenCalledTimes(1);
  });

  it('401 without opts.onAuthError retries the SAME chunk once after a 2s delay, then succeeds', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);
    let calls = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-401b', chunkSize }],
      chunkHandler: () => {
        calls += 1;
        return calls === 1 ? 'unauthorized' : 'ok';
      }
    });

    const events = [];
    const promise = uploadContent(file, { handleProgress: state => events.push(state.status) });
    await jest.advanceTimersByTimeAsync(3000);
    const result = await promise;

    expect(calls).toBe(2);
    // Same chunk (offset 0) both times — no GET resync needed, the session is alive.
    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 0]);
    expect(events).toContain(FileStatuses.RESTARTED);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  it('401 without opts.onAuthError is fatal if the retried chunk is ALSO 401', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);

    installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-401c', chunkSize }],
      chunkHandler: () => 'unauthorized'
    });

    const promise = uploadContent(file, {});
    // Attach a handler immediately so Node doesn't flag this as an unhandled
    // rejection while advanceTimersByTimeAsync drives the 2s backoff/retry.
    promise.catch(() => {});
    await jest.advanceTimersByTimeAsync(3000);
    await expect(promise).rejects.toBeDefined();
    expect(transport.uploadChunk).toHaveBeenCalledTimes(2);
  });

  it('abort() during the config-fetch/init phase cancels that request instead of leaving it in flight', async () => {
    const file = makeFile(50);
    let capturedFacade = null;
    let resolveConfigRequested;
    const configRequested = new Promise(resolve => {
      resolveConfigRequested = resolve;
    });

    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        let rejectFn;
        const promise = new Promise((resolve, reject) => {
          rejectFn = reject;
        });
        const xhr = { abort: jest.fn(() => rejectFn({ aborted: true })) };
        resolveConfigRequested();
        return { xhr, promise };
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });

    const promise = uploadContent(file, {
      handleProgress: (state, facade) => {
        if (!capturedFacade) {
          capturedFacade = facade;
        }
      }
    });

    await configRequested;
    capturedFacade.abort();

    let caught;
    try {
      await promise;
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(caught).toMatchObject({ aborted: true });
    expect(String(caught)).toBeTruthy();
  });

  it('performs exactly one transparent re-init on 410, and fails if the new session also expires', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let goneSent = false;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [
        { supported: true, uploadId: 'sess-a', chunkSize },
        { supported: true, uploadId: 'sess-b', chunkSize }
      ],
      chunkHandler: offset => {
        if (offset === 10 && !goneSent) {
          goneSent = true;
          return 'gone';
        }
        return 'ok';
      }
    });

    const events = [];
    const result = await uploadContent(file, { handleProgress: state => events.push(state.status) });

    expect(transport.requestJson).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: `${DEFAULT_URL_BASE}/upload-session` })
    );
    const initCalls = transport.requestJson.mock.calls.filter(
      ([a]) => a.url === `${DEFAULT_URL_BASE}/upload-session` && a.method === 'POST'
    );
    expect(initCalls).toHaveLength(2);
    // After re-init, the session restarts the chunk loop from offset 0 against the new session.
    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 10, 0, 10]);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
    expect(events).toContain(FileStatuses.RESTARTED);
  });

  it('fails fatally when a second 410 arrives after the one allowed re-init', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);

    installFakeServer({
      chunkSize,
      size,
      initResponses: [
        { supported: true, uploadId: 'sess-a', chunkSize },
        { supported: true, uploadId: 'sess-b', chunkSize }
      ],
      chunkHandler: () => 'gone'
    });

    await expect(uploadContent(file, {})).rejects.toBeDefined();
  });

  it('abort() aborts the in-flight request, DELETEs the session, and rejects with {aborted: true}', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let capturedFacade = null;
    const events = [];

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-abort', chunkSize }]
    });
    // The chunk request hangs until something calls xhr.abort() on it — exactly
    // like a real XMLHttpRequest, where abort() is what triggers the onabort
    // rejection. This lets the test wait deterministically (via `chunkRequested`,
    // a real promise unaffected by fake timers) for the in-flight request to
    // exist before cancelling it, rather than guessing how many microtask
    // ticks the setup awaits (getUploadConfig, init) need to flush.
    let resolveChunkRequested;
    const chunkRequested = new Promise(resolve => {
      resolveChunkRequested = resolve;
    });
    transport.uploadChunk.mockImplementation(({ url }) => {
      const match = url.match(/offset=(\d+)$/);
      server.chunkCalls.push({ offset: Number(match[1]) });
      let rejectFn;
      const promise = new Promise((resolve, reject) => {
        rejectFn = reject;
      });
      const xhr = { abort: jest.fn(() => rejectFn({ aborted: true })) };
      resolveChunkRequested();
      return { xhr, promise };
    });

    const promise = uploadContent(file, {
      handleProgress: (state, facade) => {
        events.push(state.status);
        if (!capturedFacade) {
          capturedFacade = facade;
        }
      }
    });

    await chunkRequested;
    expect(capturedFacade).toBeTruthy();

    capturedFacade.abort();

    let caught;
    try {
      await promise;
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(caught).toMatchObject({ aborted: true });
    expect(String(caught)).toBeTruthy();
    expect(server.deleteCalls).toEqual(['sess-abort']);
    expect(events[events.length - 1]).toBe(FileStatuses.ABORTED);
  });

  it('abort() during the single-shot (small file) path also settles the promise with {aborted: true}, no session to DELETE', async () => {
    const file = makeFile(3);
    let capturedFacade = null;
    const events = [];

    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 1000, maxSingleUploadSize: 2000 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });

    let resolveRequested;
    const requested = new Promise(resolve => {
      resolveRequested = resolve;
    });
    transport.uploadFormData.mockImplementation(() => {
      let rejectFn;
      const promise = new Promise((resolve, reject) => {
        rejectFn = reject;
      });
      const xhr = { abort: jest.fn(() => rejectFn({ aborted: true })) };
      resolveRequested();
      return { xhr, promise };
    });

    const promise = uploadContent(file, {
      handleProgress: (state, facade) => {
        events.push(state.status);
        if (!capturedFacade) {
          capturedFacade = facade;
        }
      }
    });

    await requested;
    capturedFacade.abort();

    let caught;
    try {
      await promise;
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(UploadError);
    expect(caught).toMatchObject({ aborted: true });
    expect(String(caught)).toBeTruthy();
    expect(transport.requestJson).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE' }));
    expect(events[events.length - 1]).toBe(FileStatuses.ABORTED);
  });

  it('reports monotonically non-decreasing percent even across a retry that re-uploads part of a chunk', async () => {
    const size = 20;
    const chunkSize = 20;
    const file = makeFile(size);
    let attempt = 0;

    installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-mono', chunkSize }],
      chunkHandler: () => {
        attempt += 1;
        return attempt === 1 ? 'network' : 'ok';
      }
    });

    const percents = [];
    const promise = uploadContent(file, {
      handleProgress: state => percents.push(state.percent)
    });
    await jest.advanceTimersByTimeAsync(60000);
    await promise;

    for (let i = 1; i < percents.length; i++) {
      expect(percents[i]).toBeGreaterThanOrEqual(percents[i - 1]);
    }
    expect(percents[percents.length - 1]).toBe(100);
  });

  it('recovers a lost complete() response via GET, returning the entityRef it already carries', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);
    let completeAttempts = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-complete', chunkSize }],
      completeHandler: () => {
        completeAttempts += 1;
        return completeAttempts === 1 ? 'network' : 'ok';
      }
    });
    // Simulate that the first `complete` actually succeeded server-side even
    // though the client saw a network error — GET must reveal it.
    const originalRequestJson = transport.requestJson.getMockImplementation();
    transport.requestJson.mockImplementation(args => {
      if (args.url === `${DEFAULT_URL_BASE}/upload-session/sess-complete` && args.method === 'GET' && completeAttempts === 1) {
        return jsonResponse(200, { status: 'DONE', offset: size, size, chunkSize, entityRef: 'recovered-ref' });
      }
      return originalRequestJson(args);
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(result).toEqual({ entityRef: 'recovered-ref' });
    void server;
  });

  // The init request's wire body. The server's `UploadSessionInitRequest`
  // (ecos-webapp-lib-spring) declares `name`/`size`/`mimeType`/`ecosType` as non-nullable Kotlin
  // `String`s with no default, and `JSON.stringify` drops `undefined` keys entirely, so
  // `ecosType: undefined` yields a body of just `{name,size,mimeType}` →
  // `MissingKotlinParameterException` → 400 for every call site that passes no type. A blank
  // string is what the server wants: `EcosContentUploadSessionsImpl.init` does
  // `req.ecosType.ifBlank { "temp-file" }`.
  describe('init request body', () => {
    function findInitJson() {
      const call = transport.requestJson.mock.calls.find(
        ([args]) => args.method === 'POST' && args.url === `${DEFAULT_URL_BASE}/upload-session`
      );
      expect(call).toBeDefined();
      return call[0].json;
    }

    it('sends ecosType as an empty string — never an omitted key — when the caller passes no type', async () => {
      const size = 20;
      const chunkSize = 10;
      const file = makeFile(size, { name: 'doc.pdf', type: 'application/pdf' });
      installFakeServer({ chunkSize, size, initResponses: [{ supported: true, uploadId: 'sess-init-1', chunkSize }] });

      await uploadContent(file, {});

      const json = findInitJson();
      expect(json).toEqual({ name: 'doc.pdf', size: 20, mimeType: 'application/pdf', ecosType: '' });
      // What actually goes on the wire — the whole point of this finding.
      const wire = JSON.parse(JSON.stringify(json));
      expect(Object.prototype.hasOwnProperty.call(wire, 'ecosType')).toBe(true);
      expect(wire.ecosType).toBe('');
      expect(JSON.stringify(json)).toContain('"ecosType":""');
    });

    it('never sends undefined/null for name or mimeType either (same non-nullable Kotlin fields)', async () => {
      const size = 20;
      const chunkSize = 10;
      // A Blob-like file with no name and no type at all — the worst case for those two fields.
      const file = makeFile(size, { name: '', type: '' });
      installFakeServer({ chunkSize, size, initResponses: [{ supported: true, uploadId: 'sess-init-2', chunkSize }] });

      await uploadContent(file, {});

      const wire = JSON.parse(JSON.stringify(findInitJson()));
      expect(wire.name).toBe('');
      expect(wire.mimeType).toBe('');
      expect(wire.ecosType).toBe('');
    });

    // The `workspace` option travels in exactly one channel on the wire: `attributes._workspace`.
    it('passes ecosType/workspace/attributes straight through when the caller does provide them', async () => {
      const size = 20;
      const chunkSize = 10;
      const file = makeFile(size, { name: 'doc.pdf', type: 'application/pdf' });
      installFakeServer({ chunkSize, size, initResponses: [{ supported: true, uploadId: 'sess-init-3', chunkSize }] });

      await uploadContent(file, { ecosType: 'emodel/type@doc', workspace: 'ws1', attributes: { a: 1 }, name: 'renamed.pdf' });

      const json = findInitJson();
      expect(json).toEqual({
        name: 'renamed.pdf',
        size: 20,
        mimeType: 'application/pdf',
        ecosType: 'emodel/type@doc',
        attributes: { a: 1, _workspace: 'ws1' }
      });
      expect('workspace' in json).toBe(false);
    });

    it('lets an explicit attributes._workspace win over the workspace option', async () => {
      const size = 20;
      const chunkSize = 10;
      const file = makeFile(size);
      const attributes = { a: 1, _workspace: 'explicit' };
      installFakeServer({ chunkSize, size, initResponses: [{ supported: true, uploadId: 'sess-init-5', chunkSize }] });

      await uploadContent(file, { workspace: 'ws1', attributes });

      expect(findInitJson().attributes).toEqual({ a: 1, _workspace: 'explicit' });
      // The caller may reuse its object — it must never be mutated.
      expect(attributes).toEqual({ a: 1, _workspace: 'explicit' });
    });

    it('omits workspace/attributes entirely (rather than sending null) when absent — they have server-side defaults', async () => {
      const size = 20;
      const chunkSize = 10;
      const file = makeFile(size);
      installFakeServer({ chunkSize, size, initResponses: [{ supported: true, uploadId: 'sess-init-4', chunkSize }] });

      await uploadContent(file, { workspace: null, attributes: undefined });

      const json = findInitJson();
      expect('workspace' in json).toBe(false);
      expect('attributes' in json).toBe(false);
      expect(JSON.stringify(json)).not.toContain('workspace');
    });
  });

  // A real outage kills the connection, so the resync GET that is supposed to recover from a
  // failed chunk fails for the same reason. The GET must stay inside the retry loop's try/catch,
  // or one failed GET aborts the whole upload and retry only survives outages shorter than
  // BACKOFF_INITIAL_MS.
  it('survives an outage that also kills the resync GET: chunk error → GET error → GET ok → upload completes', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let chunkAttempts = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-outage', chunkSize }],
      // The outage spans two chunk attempts...
      chunkHandler: offset => {
        if (offset === 0) {
          chunkAttempts += 1;
          if (chunkAttempts <= 2) {
            return 'network';
          }
        }
        return 'ok';
      },
      // ...and the first status GET issued inside it.
      statusHandler: call => (call === 1 ? 'network' : 'ok')
    });

    const events = [];
    const promise = uploadContent(file, { handleProgress: state => events.push(state.status) });
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(server.getStatusCalls()).toBeGreaterThanOrEqual(2);
    // Chunk 0 fails twice (the failed GET in between keeps the offset where it was), then lands.
    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 0, 0, 10]);
    expect(events).not.toContain(FileStatuses.ERROR_UPLOAD);
    expect(events).not.toContain(FileStatuses.EXCEPTION_UPLOAD);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  it('survives the same outage on the complete path (complete error → GET error → GET ok → complete ok)', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);
    let completeAttempts = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-outage-complete', chunkSize }],
      completeHandler: () => {
        completeAttempts += 1;
        return completeAttempts <= 2 ? 'network' : 'ok';
      },
      statusHandler: call => (call === 1 ? 'network' : 'ok')
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(completeAttempts).toBe(3);
    expect(server.getStatusCalls()).toBeGreaterThanOrEqual(2);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  // `ContentUploadCompletionInProgressException` is answered with `409` and
  // `ResponseEntity<Void>`: no body at all. Dereferencing `body.offset` unconditionally throws a
  // TypeError on exactly the lost-`complete`-response recovery path.
  it('a 409 with an undefined body on the CHUNK path falls back to the GET resync instead of throwing', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let conflicted = false;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-409-empty-chunk', chunkSize }],
      chunkHandler: offset => {
        if (offset === 10 && !conflicted) {
          conflicted = true;
          return 'conflict-empty';
        }
        return 'ok';
      }
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(server.getStatusCalls()).toBe(1);
    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 10, 10]);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  it('a 409 with an undefined body on the COMPLETE path falls back to the GET resync instead of throwing', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);
    let completeAttempts = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-409-empty-complete', chunkSize }],
      completeHandler: () => {
        completeAttempts += 1;
        return completeAttempts === 1 ? 'conflict-empty' : 'ok';
      }
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(completeAttempts).toBe(2);
    expect(server.getStatusCalls()).toBe(1);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  // The complete-path 409 branch needs a budget and a progress check: a server that keeps
  // answering `409 {offset: size}` makes `uploadRemainingChunks` a no-op, so a bare `continue`
  // would hammer `complete` with no backoff.
  it('a repeated 409 {offset: size} on complete backs off and resyncs instead of hammering the endpoint', async () => {
    const size = 10;
    const chunkSize = 10;
    const file = makeFile(size);
    let completeAttempts = 0;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-409-loop', chunkSize }],
      completeHandler: () => {
        completeAttempts += 1;
        // The same conflict offset every time — there is nothing left for
        // `uploadRemainingChunks` to send, so an unguarded loop never sleeps.
        return completeAttempts <= 3 ? { conflict: size } : 'ok';
      }
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(completeAttempts).toBe(4);
    // The guard forced the repeated conflicts through the backoff + GET resync path — without
    // it, not a single status GET is issued and `complete` is re-POSTed in a tight loop.
    expect(server.getStatusCalls()).toBeGreaterThanOrEqual(1);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  // The retry window accumulates consecutive failures rather than running from session start:
  // a 2 GB upload that legitimately takes 40 minutes would otherwise get zero retries after
  // minute 30. (`jest.setSystemTime` moves the wall clock without firing timers.)
  it('still retries after the session has been running longer than the whole retry window', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let clockAdvanced = false;
    let failedOnce = false;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-long', chunkSize }],
      chunkHandler: offset => {
        if (offset === 10) {
          if (!clockAdvanced) {
            clockAdvanced = true;
            // 45 minutes of successful uploading have gone by before this chunk is attempted.
            jest.setSystemTime(Date.now() + 45 * 60 * 1000);
          }
          if (!failedOnce) {
            failedOnce = true;
            return 'network';
          }
        }
        return 'ok';
      }
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(failedOnce).toBe(true);
    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 10, 10]);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  // 400/403/404 and any other unlisted 4xx are fatal.
  it('an unlisted 4xx on the chunk path is fatal, not retried for the whole window', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);

    installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-422', chunkSize }],
      chunkHandler: () => 422
    });

    const promise = uploadContent(file, {});
    promise.catch(() => {});
    await expect(promise).rejects.toMatchObject({ status: 422 });
    expect(transport.uploadChunk).toHaveBeenCalledTimes(1);
  });

  it('a 5xx on the chunk path is still retried via backoff + resync', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);
    let failed = false;

    const server = installFakeServer({
      chunkSize,
      size,
      initResponses: [{ supported: true, uploadId: 'sess-503', chunkSize }],
      chunkHandler: offset => {
        if (offset === 0 && !failed) {
          failed = true;
          return 503;
        }
        return 'ok';
      }
    });

    const promise = uploadContent(file, {});
    await jest.advanceTimersByTimeAsync(60000);
    const result = await promise;

    expect(server.chunkCalls.map(c => c.offset)).toEqual([0, 0, 10]);
    expect(result).toEqual({ entityRef: 'workspace://SpacesStore/generated-ref' });
  });

  // `DropZone.jsx` fires `this.props.onUploaded()` only on HEADERS_RECEIVED with
  // percent === 100 (consumers: _BaseDocuments.jsx's uploading spinner and the Lexical
  // FilePlugin), so a chunked path that went straight to DONE would diverge from the single-shot
  // one by file size.
  it('emits HEADERS_RECEIVED (percent 100) immediately before DONE on the chunked path, like single-shot does', async () => {
    const size = 20;
    const chunkSize = 10;
    const file = makeFile(size);

    installFakeServer({ chunkSize, size, initResponses: [{ supported: true, uploadId: 'sess-headers', chunkSize }] });

    const events = [];
    await uploadContent(file, { handleProgress: state => events.push({ status: state.status, percent: state.percent }) });

    const statuses = events.map(e => e.status);
    expect(statuses.slice(-2)).toEqual([FileStatuses.HEADERS_RECEIVED, FileStatuses.DONE]);
    expect(statuses.filter(st => st === FileStatuses.HEADERS_RECEIVED)).toHaveLength(1);
    expect(events[events.length - 2].percent).toBe(100);
  });

  // Both paths must forward `workspace`/`attributes`, and in the same single channel: the
  // workspace folded into `attributes._workspace`. `attributes` is bound by
  // `EcosContentController.postMultipartContent` (`@RequestPart("attributes") String?`).
  it('forwards workspace/attributes on the single-shot path too, not just the chunked one', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 1000, maxSingleUploadSize: 2000 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });

    let capturedFormData;
    transport.uploadFormData.mockImplementation(({ formData }) => {
      capturedFormData = formData;
      return { xhr: { abort: jest.fn() }, promise: Promise.resolve({ status: 200, body: { entityRef: 'ref' }, xhr: {} }) };
    });

    await uploadContent(file, { workspace: 'ws1', attributes: { some: 'value' } });

    expect(capturedFormData.get('workspace')).toBe(null);
    expect(JSON.parse(capturedFormData.get('attributes'))).toEqual({ some: 'value', _workspace: 'ws1' });
  });

  it('lets an explicit attributes._workspace win over the workspace option on the single-shot path', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(200, { chunkingThreshold: 1000, maxSingleUploadSize: 2000 });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });

    let capturedFormData;
    transport.uploadFormData.mockImplementation(({ formData }) => {
      capturedFormData = formData;
      return { xhr: { abort: jest.fn() }, promise: Promise.resolve({ status: 200, body: { entityRef: 'ref' }, xhr: {} }) };
    });

    const attributes = { some: 'value', _workspace: 'explicit' };
    await uploadContent(file, { workspace: 'ws1', attributes });

    expect(capturedFormData.get('workspace')).toBe(null);
    expect(JSON.parse(capturedFormData.get('attributes'))).toEqual({ some: 'value', _workspace: 'explicit' });
    expect(attributes).toEqual({ some: 'value', _workspace: 'explicit' });
  });

  // `getUploadConfig` runs on every uploadContent call, including the small-file fast path, so
  // a UI deployed against an emodel without `/upload-config` (404), or hitting a transient 5xx on
  // that one GET, must not lose the single-shot upload path. ecos-ui and emodel release
  // independently, so that version skew is realistic. The config fetch degrades to
  // `{chunkingThreshold: Infinity}`, i.e. one POST per file, instead of failing.
  it('a config-fetch HTTP failure falls back to single-shot instead of failing the upload', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(503, { message: 'config service unavailable' });
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });
    transport.uploadFormData.mockImplementation(() => ({
      xhr: { abort: jest.fn() },
      promise: Promise.resolve({ status: 200, body: { entityRef: 'single-shot-ref' }, xhr: {} })
    }));

    const result = await uploadContent(file, {});

    expect(result).toEqual({ entityRef: 'single-shot-ref' });
    expect(transport.uploadFormData).toHaveBeenCalledTimes(1);
    // No session was ever attempted — the fallback threshold is Infinity, so even a huge file
    // takes the single-shot path rather than a chunked one the server may not support.
    expect(transport.requestJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: `${DEFAULT_URL_BASE}/upload-session` })
    );
  });

  it('a 404 on /upload-config (emodel without the endpoint) falls back to single-shot even for a large file', async () => {
    const file = makeFile(50 * 1024, { name: 'big.bin' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return jsonResponse(404, undefined);
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });
    transport.uploadFormData.mockImplementation(() => ({
      xhr: { abort: jest.fn() },
      promise: Promise.resolve({ status: 200, body: { entityRef: 'legacy-ref' }, xhr: {} })
    }));

    const result = await uploadContent(file, {});

    expect(result).toEqual({ entityRef: 'legacy-ref' });
    expect(transport.uploadFormData).toHaveBeenCalledTimes(1);
  });

  it('a network error on /upload-config also falls back to single-shot', async () => {
    const file = makeFile(3, { name: 'small.txt' });
    transport.requestJson.mockImplementation(({ url }) => {
      if (url === `${DEFAULT_URL_BASE}/upload-config`) {
        return networkErrorResponse();
      }
      throw new Error(`Unexpected requestJson call: ${url}`);
    });
    transport.uploadFormData.mockImplementation(() => ({
      xhr: { abort: jest.fn() },
      promise: Promise.resolve({ status: 200, body: { entityRef: 'offline-config-ref' }, xhr: {} })
    }));

    await expect(uploadContent(file, {})).resolves.toEqual({ entityRef: 'offline-config-ref' });
  });
});

describe('getUploadConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetUploadConfigCache();
  });

  it('caches the config for the session (module-level) instead of refetching every call', async () => {
    transport.requestJson.mockImplementation(() => jsonResponse(200, { chunkingThreshold: 10, maxSingleUploadSize: 20 }));

    const first = await getUploadConfig(DEFAULT_URL_BASE);
    const second = await getUploadConfig(DEFAULT_URL_BASE);

    expect(first).toEqual({ chunkingThreshold: 10, maxSingleUploadSize: 20 });
    expect(second).toBe(first);
    expect(transport.requestJson).toHaveBeenCalledTimes(1);
  });

  it('refetches once the 60s TTL has elapsed', async () => {
    jest.useFakeTimers();
    transport.requestJson.mockImplementation(() => jsonResponse(200, { chunkingThreshold: 10, maxSingleUploadSize: 20 }));

    await getUploadConfig(DEFAULT_URL_BASE);
    jest.advanceTimersByTime(61 * 1000);
    await getUploadConfig(DEFAULT_URL_BASE);

    expect(transport.requestJson).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
