/**
 * The doc-lib Web Worker's `handleUploadFile` routes content upload through
 * `src/helpers/chunkedUpload`'s `uploadContent`, and cancellation goes through the module's
 * control facade rather than a raw `AbortController`. These tests exercise `worker.js` itself
 * (not the `?worker` mock used elsewhere for the main-thread `Worker` handle) and pin:
 *   - `uploadContent` is called with the expected opts shape (workspace/urlBase, and no
 *     `ecosType` — passing one would switch the server from the temp-file path to a different
 *     record-creation path),
 *   - the progress/success/error `postMessage` shapes sent to the main thread,
 *   - only a primitive (the HTTP status) crosses the postMessage boundary on failure, never the
 *     `UploadError` instance itself,
 *   - `ACTION_CANCEL_REQUEST` resolves to a `.abort()` call through `activeRequests`, reaching
 *     both the upload's control facade and the still-separate `createChild` request.
 *
 * `worker.js` is required once, not per test: `jest.resetModules()` would also discard the
 * `jest.mock('@/helpers/chunkedUpload')` linkage between the test file's own import and
 * worker.js's, so the mock's calls would silently stop reaching worker.js. Tests use distinct
 * file names instead, so their `requestId`s (`name-size-lastModified-dirId`) never collide.
 */
import { uploadContent } from '@/helpers/chunkedUpload';
import { ACTION_CANCEL_REQUEST, WORKER_STATUSES } from '@/workers/docLib/constants';

jest.mock('@/helpers/chunkedUpload');

// Capture the `ACTION_CANCEL_REQUEST` listener worker.js registers via
// `self.addEventListener('message', ...)` (worker.js:12-19) so tests can invoke it directly.
// `self.dispatchEvent(new MessageEvent('message', ...))` is NOT an option here: per the DOM event
// model `self.onmessage` (the *other*, unrelated 'message' listener worker.js assigns for the
// whole upload orchestration) fires for the exact same event too, re-entering self.onmessage with
// bogus `{type: ACTION_CANCEL_REQUEST, requestId}` data and corrupting the rest of the flow.
let cancelListener;
const originalAddEventListener = self.addEventListener.bind(self);
jest.spyOn(self, 'addEventListener').mockImplementation((type, handler, options) => {
  if (type === 'message') {
    cancelListener = handler;
  }
  return originalAddEventListener(type, handler, options);
});

require('../worker.js');

// worker.js reassigns `self.onmessage` to a one-shot confirmation resolver while it waits for a
// replace-file answer (getConfirmationFromMainThread) and never restores it — in production every
// upload gets a fresh Worker. Pin the orchestrator here so every test starts the real flow.
const uploadHandler = self.onmessage;

const RECORDS_ERROR_TEXT = 'Document with name "a.txt" already exists';
const recordsErrorBody = (msg = RECORDS_ERROR_TEXT) =>
  JSON.stringify({
    messages: [{ level: 'ERROR', type: 'records-error', msg: { type: 'EcosWebException', msg, stackTrace: [], data: {} } }],
    records: []
  });

function makeFile(name, size = 10) {
  return new File([new Uint8Array(size)], name, { type: 'text/plain' });
}

function requestIdFor(file, dirId) {
  return `${file.name}-${file.size}-${file.lastModified}-${dirId}`;
}

describe('docLib worker.js handleUploadFile via uploadContent', () => {
  let postMessageSpy;

  beforeEach(() => {
    fetchMock.resetMocks();
    uploadContent.mockReset();
    postMessageSpy = jest.spyOn(self, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    postMessageSpy.mockRestore();
  });

  function runUpload(file, { folderId = 'folder', rootId = 'root', ws, folderItemsBody } = {}) {
    // getFolderItems(folderId) queries existing children first; respond with none so the new
    // file takes the plain `items.push(item)` branch in self.onmessage.
    fetchMock.mockResponseOnce(folderItemsBody || JSON.stringify({ records: [] }));

    return uploadHandler({
      data: {
        items: [{ file, name: file.name, nodeType: 'FILE', path: `/${file.name}` }],
        rootId,
        folderId,
        totalCount: 1,
        destinations: { file: 'doclib/file-type', dir: 'doclib/dir-type' },
        ...(ws !== undefined && { ws })
      }
    });
  }

  it('uploads via uploadContent with workspace/urlBase (no ecosType), then creates the child record', async () => {
    const file = makeFile('a.txt');

    uploadContent.mockImplementation(async (_file, opts) => {
      // Mirrors uploadContent's own contract: handleProgress is called at least once,
      // synchronously, before the first await, handing back a control facade.
      opts.handleProgress({ status: 'preparing', percent: 0 }, { abort: jest.fn(), onerror: jest.fn() });
      return { entityRef: 'emodel/temp-file@abc' };
    });

    fetchMock.mockResponseOnce(JSON.stringify({ records: [{ id: 'doclib/file@new' }] })); // createChild

    await runUpload(file);

    expect(uploadContent).toHaveBeenCalledTimes(1);
    const [passedFile, opts] = uploadContent.mock.calls[0];
    expect(passedFile).toBe(file);
    // No ecosType: passing one would switch the server from creating a temp-file record (which
    // createChild then attaches to the real doc-lib record) to creating a different record of
    // that type directly.
    expect(opts).not.toHaveProperty('ecosType');
    expect(opts.workspace).toBeUndefined();
    expect(opts.urlBase).toBe('/gateway/emodel/api/ecos/webapp/content');
    expect(opts.name).toBe('a.txt');
    expect(typeof opts.handleProgress).toBe('function');

    const statuses = postMessageSpy.mock.calls.map(([msg]) => msg.status);
    expect(statuses).toContain(WORKER_STATUSES.PROGRESS_UPDATE);
    expect(statuses).toContain(WORKER_STATUSES.UPLOAD_SUCCESS);
    expect(statuses).not.toContain(WORKER_STATUSES.UPLOAD_ERROR);
  });

  it('threads the workspace id from the top-level message through to uploadContent', async () => {
    const file = makeFile('a-ws.txt');
    uploadContent.mockImplementation(async (_file, opts) => {
      opts.handleProgress({ status: 'preparing', percent: 0 }, { abort: jest.fn(), onerror: jest.fn() });
      return { entityRef: 'emodel/temp-file@abc' };
    });
    fetchMock.mockResponseOnce(JSON.stringify({ records: [{ id: 'doclib/file@new' }] }));

    await runUpload(file, { ws: 'ws1' });

    const [, opts] = uploadContent.mock.calls[0];
    expect(opts.workspace).toBe('ws1');
  });

  it('reports UPLOAD_ERROR with only the numeric status when uploadContent rejects with an UploadError', async () => {
    const file = makeFile('b.txt');

    class FakeUploadError extends Error {
      constructor() {
        super('Upload failed: 413');
        this.name = 'UploadError';
        this.status = 413;
        this.body = { message: 'too large' };
      }
    }
    uploadContent.mockRejectedValue(new FakeUploadError());

    await runUpload(file);

    const errorCall = postMessageSpy.mock.calls.map(([msg]) => msg).find(msg => msg.status === WORKER_STATUSES.UPLOAD_ERROR);
    expect(errorCall).toBeDefined();
    expect(errorCall.errorStatus).toBe(413);
    // Only the primitive status crosses the postMessage boundary — never the Error instance, its
    // `.message`, or its `.body`: an Error's own properties do not reliably survive structured
    // cloning across browsers.
    expect(errorCall).not.toHaveProperty('error');
    expect(errorCall).not.toHaveProperty('message');
    expect(errorCall).not.toHaveProperty('body');
    expect(errorCall.file.isError).toBe(true);
    expect(errorCall.file.isLoading).toBe(false);
  });

  it('reports UPLOAD_ERROR with reason/limit primitives when uploadContent rejects a chunked-upload-rejected UploadError', async () => {
    const file = makeFile('reason.txt');

    class FakeUploadError extends Error {
      constructor() {
        super('Upload rejected: max-size-exceeded');
        this.name = 'UploadError';
        this.reason = 'max-size-exceeded';
        this.maxSingleUploadSize = 100;
        this.maxFileSize = 209715200;
      }
    }
    uploadContent.mockRejectedValue(new FakeUploadError());

    await runUpload(file);

    const errorCall = postMessageSpy.mock.calls.map(([msg]) => msg).find(msg => msg.status === WORKER_STATUSES.UPLOAD_ERROR);
    expect(errorCall).toBeDefined();
    // Same "only primitives cross the boundary" rule as the errorStatus-only case above —
    // UploadStatus.jsx (via the sagas/docLib.js relay) localises these into user-facing text.
    expect(errorCall.errorReason).toBe('max-size-exceeded');
    expect(errorCall.errorMaxSingleUploadSize).toBe(100);
    expect(errorCall.errorMaxFileSize).toBe(209715200);
    expect(errorCall).not.toHaveProperty('error');
    expect(errorCall).not.toHaveProperty('message');
  });

  it('ACTION_CANCEL_REQUEST aborts both the upload control facade and the createChild AbortController', async () => {
    const file = makeFile('c.txt', 30);
    const folderId = 'folder-cancel';
    let capturedFacade;
    let resolveUpload;
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

    uploadContent.mockImplementation(
      (_file, opts) =>
        new Promise(resolve => {
          capturedFacade = { abort: jest.fn(), onerror: jest.fn() };
          opts.handleProgress({ status: 'preparing', percent: 0 }, capturedFacade);
          resolveUpload = () => resolve({ entityRef: 'emodel/temp-file@c' });
        })
    );

    const uploadPromise = runUpload(file, { folderId });

    // Let self.onmessage's own chain (getFolderItems' fetch + res.json(), then handleUploads)
    // run up to the point handleUploadFile calls uploadContent, which synchronously hands back
    // the facade via handleProgress — without letting uploadContent's own promise settle yet.
    // That's several real microtask turns (fetch + Response#json() each resolve async), so poll
    // instead of guessing a fixed tick count.
    for (let i = 0; i < 50 && !capturedFacade; i++) {
      await Promise.resolve();
    }

    expect(capturedFacade).toBeDefined();

    const requestId = requestIdFor(file, folderId);
    expect(typeof cancelListener).toBe('function');
    cancelListener({ data: { type: ACTION_CANCEL_REQUEST, requestId } });

    // The registered `activeRequests[requestId].abort()` must reach the upload's own control
    // facade (module-managed abort) AND the worker's local `createChildController` (a plain
    // AbortController, still needed because the facade only knows how to cancel the upload it
    // manages, not the separate record-creation request handleUploadFile issues afterwards).
    expect(capturedFacade.abort).toHaveBeenCalledTimes(1);
    expect(abortSpy).toHaveBeenCalledTimes(1);

    abortSpy.mockRestore();
    // Unblock the still-pending uploadContent mock so the test doesn't leak a dangling promise.
    resolveUpload();
    fetchMock.mockResponseOnce(JSON.stringify({ records: [] }));
    await uploadPromise;
  });

  // COREDEV-466: the gateway answers a failed Records request with HTTP 200 + an ERROR-level
  // `messages` entry. The worker uses raw fetch (records-core's checkRespMessages never runs
  // here), so it has to read `messages` itself, or the failure is counted as success.
  describe('records-error messages on HTTP 200 (COREDEV-466)', () => {
    const uploadOk = () =>
      uploadContent.mockImplementation(async (_file, opts) => {
        opts.handleProgress({ status: 'preparing', percent: 0 }, { abort: jest.fn(), onerror: jest.fn() });
        return { entityRef: 'emodel/temp-file@abc' };
      });

    it('createChild 200 + ERROR message is an UPLOAD_ERROR carrying the server text, not a created record', async () => {
      const file = makeFile('rec-err.txt');
      uploadOk();

      // Queued after runUpload's own (synchronously issued) children query — see the delete case.
      const uploadPromise = runUpload(file);
      fetchMock.mockResponseOnce(recordsErrorBody()); // createChild (mutate)
      await uploadPromise;

      expect(fetchMock.mock.calls[1][0]).toContain('/gateway/api/records/mutate');

      const messages = postMessageSpy.mock.calls.map(([msg]) => msg);
      const errorCall = messages.find(msg => msg.status === WORKER_STATUSES.UPLOAD_ERROR);
      expect(errorCall).toBeDefined();
      expect(errorCall.errorMessage).toBe(RECORDS_ERROR_TEXT);
      // HTTP status was 200 — must not be forwarded, or UploadStatus.jsx would add its own
      // generic "error while uploading" notification on top of the server text.
      expect(errorCall.errorStatus).toBeUndefined();
      expect(errorCall.file.isError).toBe(true);
      expect(errorCall.file.isLoading).toBe(false);
      expect(errorCall.isFatal).toBeFalsy();

      // The file is not reported as uploaded ...
      const progressAfterCreate = messages.find(msg => msg.status === WORKER_STATUSES.PROGRESS_UPDATE && msg.successFileCount === 1);
      expect(progressAfterCreate).toBeUndefined();
      // ... but the batch itself still finishes (per-file error, like an HTTP error).
      const success = messages.find(msg => msg.status === WORKER_STATUSES.UPLOAD_SUCCESS);
      expect(success).toBeDefined();
      expect(success.result).toEqual([]);
    });

    it('a children query answering 200 + ERROR aborts the upload with a fatal UPLOAD_ERROR carrying the text', async () => {
      const file = makeFile('query-err.txt');
      uploadOk();

      await runUpload(file, { folderItemsBody: recordsErrorBody('Folder is not accessible') });

      expect(uploadContent).not.toHaveBeenCalled();
      const messages = postMessageSpy.mock.calls.map(([msg]) => msg);
      const errorCall = messages.find(msg => msg.status === WORKER_STATUSES.UPLOAD_ERROR);
      expect(errorCall).toBeDefined();
      expect(errorCall.errorMessage).toBe('Folder is not accessible');
      // Nothing else will follow (no UPLOAD_SUCCESS) — the saga needs this flag to release its
      // upload promise and drop the loader instead of waiting forever.
      expect(errorCall.isFatal).toBe(true);
      expect(messages.find(msg => msg.status === WORKER_STATUSES.UPLOAD_SUCCESS)).toBeUndefined();
    });

    it('deleteChild (replace confirmed) answering 200 + ERROR reports the text and skips the re-upload', async () => {
      const file = makeFile('replace-err.txt');
      uploadOk();

      // Answer the replace confirmation as soon as the worker asks for it. Deferred by a
      // microtask: worker.js posts CONFIRM_FILE_REPLACE *before* installing its one-shot
      // `self.onmessage` resolver, so a synchronous reply would hit the wrong handler.
      postMessageSpy.mockImplementation(msg => {
        if (msg && msg.status === WORKER_STATUSES.CONFIRM_FILE_REPLACE) {
          Promise.resolve().then(() =>
            self.onmessage({ data: { status: WORKER_STATUSES.CONFIRM_FILE_RESPONSE, confirmed: true, isReplaceAllFiles: false } })
          );
        }
      });

      const existing = { id: 'emodel/doclib@root$existing-1', attributes: { name: file.name, nodeType: 'FILE' } };

      // fetch-mock's once-queue is FIFO: the children query is issued synchronously inside
      // runUpload, so the deleteChild answer is queued right after it.
      const uploadPromise = runUpload(file, { folderItemsBody: JSON.stringify({ records: [existing] }) });
      fetchMock.mockResponseOnce(recordsErrorBody('Delete is forbidden')); // deleteChild
      await uploadPromise;

      expect(fetchMock.mock.calls[1][0]).toContain('/gateway/api/records/delete');
      expect(uploadContent).not.toHaveBeenCalled();
      const messages = postMessageSpy.mock.calls.map(([msg]) => msg);
      const errorCall = messages.find(msg => msg.status === WORKER_STATUSES.UPLOAD_ERROR);
      expect(errorCall).toBeDefined();
      expect(errorCall.errorMessage).toBe('Delete is forbidden');
      expect(errorCall.errorStatus).toBeUndefined();
      expect(errorCall.file.file).toBe(file);
      expect(errorCall.file.isError).toBe(true);
      expect(errorCall.isFatal).toBeFalsy();
      // Batch still completes: the skipped file is simply not in the result.
      const success = messages.find(msg => msg.status === WORKER_STATUSES.UPLOAD_SUCCESS);
      expect(success).toBeDefined();
      expect(success.result).toEqual([]);
    });
  });
});
