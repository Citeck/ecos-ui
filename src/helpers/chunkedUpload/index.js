/**
 * Public API of the chunked upload client.
 *
 * DOM-free: no React, no redux, no `window`/`document` — this module is
 * imported both from the main thread and from a dedicated Web Worker.
 *
 * `handleProgress(state, controlFacade)` and the `FileStatuses` vocabulary
 * below are a byte-for-byte copy of `src/helpers/ecosXhr.js`'s contract
 * (values only — this module does not import ecosXhr.js itself, since that
 * pulls in browser-only helpers that are unsafe to bundle into a worker).
 * `controlFacade` exposes:
 *   - `abort()` — cancels the in-flight request (config fetch, init, chunk,
 *     complete or single-shot — whichever is in flight) and, for a chunked
 *     upload, fire-and-forgets `DELETE` of the session.
 *   - `onerror()` — a safe no-op. `DropZone.handleChangeStatus` calls
 *     `xhr.onerror(clientError)` directly on the ERROR_UPLOAD branch, a
 *     dedup quirk inherited from ecosXhr; this module already settles its
 *     own promise on a fatal error, so the call just needs not to throw.
 *
 * `response` handed to `handleProgress` on ERROR_UPLOAD is always the raw
 * parsed server JSON body (or `undefined` when there is none, e.g. a network
 * error) — the same shape on every path, chunked or single-shot — because
 * `DropZone.jsx`/`AddModal.jsx` both do
 * `const { message, status } = response; const { description } = status || {}`.
 * The HTTP status code itself (when there is one) still travels on the
 * *rejected* error value for callers that want it programmatically.
 *
 * ## Rejection contract
 *
 * Every rejection `uploadContent` produces (including a session-init HTTP failure — that
 * surfaces through `uploadContent`'s own promise too, not just chunk/complete failures) is an
 * instance of `UploadError` (exported below), which is itself an `Error` subclass:
 *   - `err instanceof Error` always holds, so callers that just log/stringify a rejection
 *     (`String(err)`, template-literal interpolation, `Array.prototype.join`) get readable text
 *     instead of `"[object Object]"`.
 *   - `err.message` is human-readable: the server's own `body.message` when there is one,
 *     otherwise a specific fallback such as `"Upload failed: 413"` — never a bare generic string
 *     when a status code is known.
 *   - Every structured field a consumer keys off is an own enumerable property on the instance:
 *     `reason`, `maxSingleUploadSize`, `maxFileSize`, `type` for the `chunked-upload-rejected`
 *     case; `status`, `body` for HTTP failures; `aborted` for the abort case; `networkError` for
 *     a transport-level failure. The i18n layer keys off `reason`.
 *
 * A failed `/upload-config` GET is not part of that list: it degrades to the single-shot path
 * instead of rejecting — see `getUploadConfig`.
 */
import { AbortedError, FatalUploadError, runChunkedSession, SessionExpiredError } from './session';
import { requestJson, uploadFormData } from './transport';

export const DEFAULT_URL_BASE = '/gateway/emodel/api/ecos/webapp/content';

// Mirrors src/helpers/ecosXhr.js FileStatuses — values only, see file header.
export const FileStatuses = {
  PREPARING: 'preparing',
  GETTING_UPLOAD_PARAMS: 'getting_upload_params',
  UPLOADING: 'uploading',
  RESTARTED: 'restarted',
  ABORTED: 'aborted',
  ERROR_UPLOAD: 'error_upload',
  EXCEPTION_UPLOAD: 'exception_upload',
  HEADERS_RECEIVED: 'headers_received',
  DONE: 'done'
};

/**
 * Every rejection from `uploadContent`/`getUploadConfig` is an instance of this class — see the
 * "Rejection contract" section in this file's header comment. `message` is always a human-
 * readable string; `fields` (status/body/reason/maxSingleUploadSize/maxFileSize/aborted/
 * networkError/type/...) are copied on as own enumerable properties so existing and future
 * consumers can keep reading them exactly like they read the old bare-object rejections.
 */
export class UploadError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'UploadError';
    if (fields) {
      Object.assign(this, fields);
    }
  }
}

/**
 * Picks the best human-readable message for a failed request, given whatever of
 * `{status, body, networkError, message}` is known:
 *   1. an explicit `message` (e.g. from a transport-level `{networkError, message}` rejection)
 *   2. the server's own `body.message` (or `body` itself when it's already a string)
 *   3. `"Upload failed: network error"` when we know it was a transport failure
 *   4. `"Upload failed: <status>"` when we at least know the HTTP status
 *   5. a bare `"Upload failed"` fallback
 * @param {{status?: number, body?: *, networkError?: boolean, message?: string}} [info]
 * @returns {string}
 */
function describeFailure({ status, body, networkError, message } = {}) {
  if (typeof message === 'string' && message) {
    return message;
  }
  if (body && typeof body === 'object' && typeof body.message === 'string' && body.message) {
    return body.message;
  }
  if (typeof body === 'string' && body) {
    return body;
  }
  if (networkError) {
    return 'Upload failed: network error';
  }
  if (typeof status === 'number') {
    return `Upload failed: ${status}`;
  }
  return 'Upload failed';
}

const CONFIG_CACHE_TTL_MS = 60 * 1000;
// A *failed* config fetch is cached far more briefly than a successful one: long enough that a
// burst of uploads doesn't re-GET a dead endpoint once per file, short enough that the chunked
// path comes back on its own as soon as the server is healthy again.
const CONFIG_FAILURE_CACHE_TTL_MS = 10 * 1000;
/**
 * What `getUploadConfig` answers when `/upload-config` cannot be read. ecos-ui and emodel release
 * independently, so a UI running against an emodel without the new endpoint (404) — or hitting a
 * transient 5xx/401/network failure on that one GET — is realistic and must not lose the
 * single-shot upload path. `Infinity` makes `file.size < cfg.chunkingThreshold` true for every
 * file, so everything takes the single-shot path.
 */
const FALLBACK_CONFIG = { chunkingThreshold: Infinity, maxSingleUploadSize: Infinity };
let configCache = null; // { urlBase, value, fetchedAt, failed }

/**
 * Fetches `/upload-config`, cached module-wide for 60s.
 *
 * Never rejects because of the *server's* answer: an HTTP error, an unusable body or a transport
 * failure all degrade to `FALLBACK_CONFIG` (single-shot for every file) rather than failing the
 * upload — see that constant. The single exception is an `abort()` while this request is in
 * flight, which rethrows `AbortedError` so the cancel still settles as a cancel.
 * @param {string} [urlBase]
 * @param {Object} [ctl] internal — `{ setActiveXhr }` so `abort()` can cancel
 *   this request while it's in flight; omitted by ordinary callers.
 * @returns {Promise<{chunkingThreshold: number, maxSingleUploadSize: number}>}
 */
export async function getUploadConfig(urlBase = DEFAULT_URL_BASE, { setActiveXhr } = {}) {
  const now = Date.now();

  if (configCache && configCache.urlBase === urlBase) {
    const ttl = configCache.failed ? CONFIG_FAILURE_CACHE_TTL_MS : CONFIG_CACHE_TTL_MS;
    if (now - configCache.fetchedAt < ttl) {
      return configCache.value;
    }
  }

  const useFallback = () => {
    configCache = { urlBase, value: FALLBACK_CONFIG, fetchedAt: now, failed: true };
    return FALLBACK_CONFIG;
  };

  const { xhr, promise } = requestJson({ url: `${urlBase}/upload-config`, method: 'GET' });
  if (setActiveXhr) {
    setActiveXhr(xhr);
  }

  let status;
  let body;
  try {
    ({ status, body } = await promise);
  } catch (err) {
    if (err && err.aborted) {
      throw new AbortedError();
    }
    return useFallback();
  } finally {
    if (setActiveXhr) {
      setActiveXhr(null);
    }
  }

  if (status !== 200 || !body || typeof body.chunkingThreshold !== 'number') {
    return useFallback();
  }

  configCache = { urlBase, value: body, fetchedAt: now };
  return body;
}

/**
 * Test-only: forces the next `getUploadConfig()` call to refetch.
 */
export function __resetUploadConfigCache() {
  configCache = null;
}

function rejectionOf(initResp) {
  const fields = {
    type: 'chunked-upload-rejected',
    reason: initResp.reason,
    maxSingleUploadSize: initResp.maxSingleUploadSize,
    maxFileSize: initResp.maxFileSize // may be -1 ("no limit") — never render/compare as a byte count
  };
  return new UploadError(`Upload rejected: ${initResp.reason}`, fields);
}

/**
 * Folds the public `opts.workspace` option into the attributes: `_workspace` inside `attributes`
 * is the only channel the server reads, on both upload paths.
 *
 * Returns `opts.attributes` untouched when there is no workspace to fold; otherwise a COPY (the
 * caller may reuse its object) with `_workspace` added, unless the attributes already carry one —
 * an explicit `_workspace` wins. A JSON-string `attributes` is parsed first; a malformed one
 * throws rather than silently uploading into the wrong workspace.
 * @returns {Object|string|undefined}
 */
function foldWorkspace(opts) {
  if (!opts.workspace) {
    return opts.attributes;
  }
  const attributes = typeof opts.attributes === 'string' ? JSON.parse(opts.attributes) : opts.attributes || {};
  return attributes._workspace ? attributes : { ...attributes, _workspace: opts.workspace };
}

function buildFormData(file, opts) {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('name', opts.name || file.name);

  if (opts.ecosType) {
    formData.append('ecosType', opts.ecosType);
  }

  // Parity with the chunked path's init body: both paths forward the same caller-supplied
  // metadata (workspace folded in), or behaviour silently differs by file size. Bound by
  // `EcosContentController.postMultipartContent` (`@RequestPart("attributes") String?`, parsed
  // with `ObjectData.create(attributes)`), so it goes out as a JSON string.
  const attributes = foldWorkspace(opts);
  if (attributes) {
    formData.append('attributes', typeof attributes === 'string' ? attributes : JSON.stringify(attributes));
  }

  return formData;
}

/**
 * Thrown by `uploadSingleShot` once it has already emitted the correct
 * terminal `handleProgress` status itself (mirroring `ecosXhr.js`'s single
 * `handleProgress` call per outcome) — `uploadContent`'s outer catch must
 * unwrap and rethrow `payload` WITHOUT emitting anything again. `payload` is
 * always already an `UploadError` (see the rejection contract above) — this
 * class exists purely as an internal "already reported" marker, not as part
 * of the public rejection shape.
 */
class AlreadyReportedError extends Error {
  constructor(payload) {
    super('single-shot upload failed');
    this.name = 'AlreadyReportedError';
    this.payload = payload;
  }
}

/**
 * The existing (non-chunked) single-request upload path — mirrors
 * `AppApi.uploadFileV2` + `ecosXhr`'s state machine exactly so behaviour is
 * indistinguishable from today for small files / unsupported storages:
 * exactly one terminal `handleProgress` call (`HEADERS_RECEIVED`+`DONE` on
 * success, `ERROR_UPLOAD` on an HTTP error, `EXCEPTION_UPLOAD` on a network
 * error), then settle the promise with the raw body (success) or an
 * `UploadError` (failure — see the rejection contract above).
 * Callers must have already emitted PREPARING (uploadContent does, once,
 * before branching) so the control facade reaches consumers early enough to
 * wire up e.g. DropZone's cancel button.
 */
function uploadSingleShot(file, opts, ctl) {
  const formData = buildFormData(file, opts);

  return new Promise((resolve, reject) => {
    const { xhr, promise } = uploadFormData({
      url: opts.urlBase || DEFAULT_URL_BASE,
      formData,
      onUploadProgress: (loaded, total) => {
        ctl.setPercent((loaded * 100.0) / (total || loaded || 1) || 100);
        ctl.emit(FileStatuses.UPLOADING);
      }
    });

    ctl.setActiveXhr(xhr);

    promise.then(
      ({ status, body }) => {
        ctl.setActiveXhr(null);
        if (ctl.isAborted()) {
          // abort() already aborted this xhr; let the caller's outer catch
          // (keyed on AbortedError) emit ABORTED and settle uniformly.
          reject(new AbortedError());
          return;
        }
        if (status === 0) {
          const fields = { status, body, networkError: true };
          ctl.emit(FileStatuses.EXCEPTION_UPLOAD, body);
          reject(new AlreadyReportedError(new UploadError(describeFailure(fields), fields)));
          return;
        }
        if (status >= 400) {
          const fields = { status, body };
          ctl.emit(FileStatuses.ERROR_UPLOAD, body);
          reject(new AlreadyReportedError(new UploadError(describeFailure(fields), fields)));
          return;
        }
        ctl.setPercent(100);
        ctl.emit(FileStatuses.HEADERS_RECEIVED, body);
        ctl.emit(FileStatuses.DONE, body);
        resolve(body);
      },
      err => {
        ctl.setActiveXhr(null);
        if (err && err.aborted) {
          reject(new AbortedError());
          return;
        }
        ctl.emit(FileStatuses.EXCEPTION_UPLOAD, err);
        const fields = { networkError: true };
        reject(new AlreadyReportedError(new UploadError(describeFailure({ ...fields, message: err && err.message }), fields)));
      }
    );
  });
}

/**
 * @param {File|Blob} file
 * @param {Object} opts {ecosType, workspace, name, attributes, handleProgress, urlBase, onAuthError}
 * @returns {Promise<{entityRef: string}>} rejects with an `UploadError` — see the rejection
 *   contract in this file's header comment.
 */
export async function uploadContent(file, opts = {}) {
  const urlBase = opts.urlBase || DEFAULT_URL_BASE;
  const handleProgress = opts.handleProgress;

  const state = {
    aborted: false,
    activeXhr: null,
    uploadId: null,
    percent: 0
  };

  const facade = {
    abort() {
      if (state.aborted) {
        return;
      }
      state.aborted = true;
      if (state.activeXhr) {
        state.activeXhr.abort();
      }
      if (state.uploadId) {
        // Fire-and-forget — the session will also expire on its own.
        requestJson({ url: `${urlBase}/upload-session/${state.uploadId}`, method: 'DELETE' }).promise.catch(() => {});
      }
    },
    onerror() {
      // See file header — DropZone.jsx dedup quirk, intentionally a no-op.
    }
  };

  const ctl = {
    setActiveXhr: xhr => {
      state.activeXhr = xhr;
    },
    isAborted: () => state.aborted,
    setPercent: percent => {
      // Percent must be monotonic — never show progress moving backwards,
      // even across a retry that re-uploads part of the current chunk.
      state.percent = Math.max(percent, state.percent);
    },
    emit: (status, response) => {
      if (!handleProgress) {
        return;
      }
      const payload = { status, percent: state.percent };
      if (response !== undefined) {
        payload.response = response;
      }
      handleProgress(payload, facade);
    }
  };

  try {
    ctl.emit(FileStatuses.PREPARING);
    const cfg = await getUploadConfig(urlBase, { setActiveXhr: ctl.setActiveXhr });
    if (state.aborted) {
      throw new AbortedError();
    }

    if (file.size < cfg.chunkingThreshold) {
      return await uploadSingleShot(file, opts, ctl);
    }

    ctl.emit(FileStatuses.GETTING_UPLOAD_PARAMS);
    let initResp = await initSession(file, opts, urlBase, ctl.setActiveXhr);
    if (state.aborted) {
      throw new AbortedError();
    }

    if (!initResp.supported) {
      if (file.size <= initResp.maxSingleUploadSize) {
        return await uploadSingleShot(file, opts, ctl);
      }
      throw rejectionOf(initResp);
    }

    let reInited = false;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      state.uploadId = initResp.uploadId;

      const onChunkProgress = (confirmedOffset, loadedInChunk) => {
        ctl.setPercent(((confirmedOffset + loadedInChunk) / file.size) * 100);
        ctl.emit(FileStatuses.UPLOADING);
      };
      const onRestart = () => ctl.emit(FileStatuses.RESTARTED);

      try {
        const entityRef = await runChunkedSession({
          file,
          urlBase,
          uploadId: initResp.uploadId,
          size: file.size,
          chunkSize: initResp.chunkSize,
          startOffset: 0,
          onChunkProgress,
          onRestart,
          onAuthError: opts.onAuthError,
          isAborted: ctl.isAborted,
          setActiveXhr: ctl.setActiveXhr
        });

        ctl.setPercent(100);
        const result = { entityRef };
        // HEADERS_RECEIVED before DONE, exactly like the single-shot path: `DropZone.jsx` fires
        // `this.props.onUploaded()` ONLY on HEADERS_RECEIVED with percent === 100 (consumers:
        // `_BaseDocuments.jsx`'s uploading spinner and the Lexical FilePlugin). Without it the
        // progress contract would silently diverge by file size.
        ctl.emit(FileStatuses.HEADERS_RECEIVED, result);
        ctl.emit(FileStatuses.DONE, result);
        return result;
      } catch (err) {
        if (err instanceof SessionExpiredError && !reInited) {
          reInited = true;
          onRestart();
          initResp = await initSession(file, opts, urlBase, ctl.setActiveXhr);
          if (state.aborted) {
            throw new AbortedError();
          }
          if (!initResp.supported) {
            // The server withdrew chunked support on re-init — fall back if possible.
            if (file.size <= initResp.maxSingleUploadSize) {
              return await uploadSingleShot(file, opts, ctl);
            }
            throw rejectionOf(initResp);
          }
          continue; // one transparent re-init, then retry the whole session from offset 0
        }
        throw err;
      }
    }
  } catch (err) {
    if (state.aborted || err instanceof AbortedError || (err && err.aborted)) {
      ctl.emit(FileStatuses.ABORTED);
      throw new UploadError('Upload aborted', { aborted: true });
    }
    if (err instanceof AlreadyReportedError) {
      // uploadSingleShot already emitted the correct (and only) terminal status, and its
      // payload is already an UploadError (see the rejection contract above).
      throw err.payload;
    }
    if (err instanceof SessionExpiredError) {
      const info = { reason: 'session-expired' };
      // Same shape DropZone.jsx/AddModal.jsx already parse (a plain object, not the UploadError
      // thrown below) — the handleProgress contract in the file header is independent of the
      // rejection contract.
      ctl.emit(FileStatuses.ERROR_UPLOAD, info);
      throw new UploadError('Upload session expired', info);
    }
    if (err instanceof FatalUploadError) {
      // Emit the same shape DropZone.jsx/AddModal.jsx already parse (the raw
      // server body) — the HTTP status stays available on the rejected
      // `UploadError` for programmatic callers.
      ctl.emit(FileStatuses.ERROR_UPLOAD, err.info.body);
      throw new UploadError(describeFailure(err.info), err.info);
    }
    // Anything else reaching here is already an `UploadError` (e.g. rejectionOf()'s
    // chunked-upload-rejected error, thrown directly) or an unanticipated internal failure —
    // either way, honour the rejection contract instead of leaking a bare object/unrecognised
    // Error subclass.
    ctl.emit(FileStatuses.ERROR_UPLOAD, err);
    throw err instanceof Error ? err : new UploadError(describeFailure({ body: err }), {});
  }
}

/**
 * Builds the `POST /upload-session` body.
 *
 * `name`, `mimeType` and especially `ecosType` are coerced to `''` and never left `undefined`:
 * `JSON.stringify` drops `undefined` keys entirely, and the server's `UploadSessionInitRequest`
 * (ecos-webapp-lib-spring) declares all three as non-nullable `String` with NO default — a body
 * missing `ecosType` (or carrying `null`) fails Jackson-Kotlin deserialisation with
 * `MissingKotlinParameterException`, i.e. a 400 for every call site that doesn't pass a type
 * (doc-lib, activities, the version journal, the profile photo, the AI hook…).
 * A blank `ecosType` is exactly what the server wants: `EcosContentUploadSessionsImpl.init`
 * does `req.ecosType.ifBlank { "temp-file" }`, which is the intended default semantics.
 *
 * `attributes` (which carries the workspace as `_workspace` — see `foldWorkspace`) DOES have a
 * server-side default, so the key is omitted entirely when there is nothing to send — omitted is
 * fine for a defaulted Kotlin parameter, an explicit `null` would not be.
 */
function buildInitBody(file, opts) {
  const json = {
    name: opts.name || file.name || '',
    size: file.size,
    mimeType: file.type || '',
    ecosType: opts.ecosType || ''
  };

  const attributes = foldWorkspace(opts);
  if (attributes !== undefined && attributes !== null) {
    json.attributes = attributes;
  }

  return json;
}

async function initSession(file, opts, urlBase, setActiveXhr) {
  const { xhr, promise } = requestJson({
    url: `${urlBase}/upload-session`,
    method: 'POST',
    json: buildInitBody(file, opts)
  });
  if (setActiveXhr) {
    setActiveXhr(xhr);
  }

  let status;
  let body;
  try {
    ({ status, body } = await promise);
  } finally {
    if (setActiveXhr) {
      setActiveXhr(null);
    }
  }

  if (status !== 200) {
    // The endpoint always answers 200 — anything else is a transport/server bug.
    throw new FatalUploadError({ status, body });
  }

  return body;
}
