/**
 * The chunk-upload retry/resume loop.
 *
 * DOM-free: only uses `setTimeout` and the `transport.js` primitives.
 */
import { requestJson, uploadChunk } from './transport';

export const BACKOFF_INITIAL_MS = 1000;
export const BACKOFF_MAX_MS = 30000;
// Cumulative window of CONSECUTIVE failures for one session attempt — kept comfortably under
// the server's sessionIdleTimeout. See `createRetryBudget` for why this is not an absolute
// session deadline.
export const RETRY_WINDOW_MS = 30 * 60 * 1000;
export const AUTH_RETRY_DELAY_MS = 2000;

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Thrown on 410 — caller may perform exactly one transparent re-init.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('upload session expired');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Thrown when `isAborted()` becomes true mid-loop.
 */
export class AbortedError extends Error {
  constructor() {
    super('upload aborted');
    this.name = 'AbortedError';
  }
}

/**
 * Thrown for any non-retryable failure. `info` carries {status, body} or {networkError:true}.
 */
export class FatalUploadError extends Error {
  constructor(info) {
    super('upload failed');
    this.name = 'FatalUploadError';
    this.info = info;
  }
}

/**
 * Thrown when the status GET used to resynchronise after a failure ITSELF fails at the
 * transport level (or with a 5xx). This is emphatically NOT fatal: a real outage takes the
 * whole connection down, so the very same network condition that killed the chunk POST kills
 * the GET that was supposed to recover from it. The retry loops catch this, keep their current
 * offset and stay in the backoff loop — only the retry budget may end the upload.
 *
 * It also exists so `fetchSessionStatus` never lets `transport.js`'s bare
 * `{networkError: true, message}` rejection escape into `uploadContent`'s generic catch, where
 * it would have been reported as an unrecognised internal failure.
 */
export class ResyncFailedError extends Error {
  constructor(info) {
    super('upload session status request failed');
    this.name = 'ResyncFailedError';
    this.info = info || { networkError: true };
  }
}

/**
 * The retry budget for one chunked-session attempt.
 *
 * A consecutive-failure accumulator, not an absolute `sessionStart + 30min` deadline: a slow
 * 2 GB upload can run longer than the whole window, and an absolute deadline would leave such an
 * upload with zero retries for its entire second half. The server's session TTL slides on every
 * accepted chunk too. So every accepted chunk / successful `complete` resets the accumulator, and
 * only an unbroken run of failures longer than `windowMs` is fatal.
 *
 * @param {number} [windowMs]
 * @returns {{noteSuccess: function(): void, noteFailure: function(): boolean}} `noteFailure()`
 *   records one failure and returns `true` once the consecutive-failure window is used up (the
 *   very first failure of a run always returns `false`, i.e. always gets at least one retry).
 */
export function createRetryBudget(windowMs = RETRY_WINDOW_MS) {
  let firstFailureAt = null;

  return {
    noteSuccess() {
      firstFailureAt = null;
    },
    noteFailure() {
      const now = Date.now();
      if (firstFailureAt === null) {
        firstFailureAt = now;
        return false;
      }
      return now - firstFailureAt > windowMs;
    }
  };
}

function throwIfAborted(isAborted) {
  if (isAborted()) {
    throw new AbortedError();
  }
}

/**
 * GET the session status — used to resynchronise after a network error/5xx.
 *
 * Failure taxonomy (all normalised — never a bare transport rejection object):
 *   - transport failure / 5xx / status 0 → `ResyncFailedError` (retryable, see that class)
 *   - 410 → `SessionExpiredError` (caller may re-init once)
 *   - any other non-200, or a 200 without a numeric `offset` → `FatalUploadError`
 * @returns {Promise<Object>} the parsed status body ({status, offset, size, ..., entityRef?})
 */
async function fetchSessionStatus({ urlBase, uploadId }) {
  let result;
  try {
    result = await requestJson({ url: `${urlBase}/upload-session/${uploadId}`, method: 'GET' }).promise;
  } catch (err) {
    if (err && err.aborted) {
      throw new AbortedError();
    }
    throw new ResyncFailedError({ networkError: true, message: (err && err.message) || 'network error' });
  }

  const { status, body } = result;

  if (status === 410) {
    throw new SessionExpiredError();
  }
  if (status === 200) {
    if (!body || typeof body.offset !== 'number') {
      throw new FatalUploadError({ status, body, protocolError: true });
    }
    return body;
  }
  if (status === 0 || status >= 500) {
    throw new ResyncFailedError({ status, body });
  }
  // 400/403/404 and any other 4xx are fatal.
  throw new FatalUploadError({ status, body });
}

/**
 * @returns {Promise<number>} confirmed offset
 */
async function fetchConfirmedOffset({ urlBase, uploadId }) {
  const body = await fetchSessionStatus({ urlBase, uploadId });
  return body.offset;
}

/**
 * Uploads every remaining chunk starting at `startOffset`, returning the
 * final (== size) offset once all chunks are confirmed by the server.
 */
export async function uploadChunks({
  file,
  urlBase,
  uploadId,
  size,
  chunkSize,
  startOffset,
  retryBudget,
  onChunkProgress,
  onRestart,
  onAuthError,
  isAborted,
  setActiveXhr
}) {
  let offset = startOffset;
  let backoffDelay = BACKOFF_INITIAL_MS;
  let authRetried = false;

  while (offset < size) {
    throwIfAborted(isAborted);

    const len = Math.min(chunkSize, size - offset);
    const blob = file.slice(offset, offset + len);
    const chunkOffset = offset;

    const { xhr, promise } = uploadChunk({
      url: `${urlBase}/upload-session/${uploadId}/chunk?offset=${chunkOffset}`,
      blob,
      onUploadProgress: loaded => onChunkProgress(chunkOffset, loaded)
    });
    setActiveXhr(xhr);

    let result = null;
    try {
      result = await promise;
    } catch (err) {
      setActiveXhr(null);
      if (err && err.aborted) {
        throw new AbortedError();
      }
      // Network error/timeout — fall through to the shared retry-via-GET path below.
    }
    setActiveXhr(null);
    throwIfAborted(isAborted);

    // What the shared retry path at the bottom reports if the budget runs out on this attempt.
    let failureInfo = { networkError: true };

    if (result) {
      const { status, body } = result;
      failureInfo = { status, body };

      if (status === 200) {
        // The endpoint's contract guarantees the confirmed offset in the
        // body; a 200 without one is a protocol violation, not something to
        // paper over by guessing the offset locally.
        if (!body || typeof body.offset !== 'number') {
          throw new FatalUploadError({ status, body, protocolError: true });
        }
        offset = body.offset;
        backoffDelay = BACKOFF_INITIAL_MS;
        authRetried = false;
        retryBudget.noteSuccess();
        continue;
      }
      if (status === 410) {
        throw new SessionExpiredError();
      }
      if (status === 401) {
        if (typeof onAuthError === 'function') {
          onAuthError();
          throw new FatalUploadError({ status, body });
        }
        if (authRetried) {
          throw new FatalUploadError({ status, body });
        }
        authRetried = true;
        await sleep(AUTH_RETRY_DELAY_MS);
        onRestart();
        continue; // session is alive server-side — retry the SAME chunk, no resync needed
      }
      if (status === 409) {
        // A 409 does NOT always carry a body: `ContentUploadCompletionInProgressException`
        // (a chunk POST against a session the server is already COMPLETING) is answered with
        // `ResponseEntity<Void>` — no body at all. Dereferencing `body.offset` there used to
        // throw a TypeError and kill the upload.
        const next = body && typeof body.offset === 'number' ? body.offset : null;
        // A 409 whose confirmed offset is exactly where we just tried to write tells us nothing
        // new — retrying it immediately (no sleep) would be a tight loop against the server, so
        // treat it like any other unproductive answer and fall through to backoff + resync.
        if (next !== null && next !== chunkOffset) {
          // Productive: jump to the offset the server confirmed and retry from there straight
          // away. It still counts against the retry budget (no `noteSuccess()` — nothing was
          // written), so a server that keeps conflicting at ever-changing offsets cannot keep
          // this loop spinning forever; the first chunk that actually lands resets the budget.
          if (retryBudget.noteFailure()) {
            throw new FatalUploadError({ status, body });
          }
          offset = next;
          backoffDelay = BACKOFF_INITIAL_MS;
          authRetried = false;
          continue;
        }
        // fall through to the shared backoff + GET resync path below
      } else if (status >= 400 && status < 500) {
        // The default for an unlisted 4xx is fatal, not "retry for the whole window".
        throw new FatalUploadError({ status, body });
      }
      // 5xx / unexpected status / unproductive 409 — treat like a network error below.
    }

    if (retryBudget.noteFailure()) {
      throw new FatalUploadError(failureInfo);
    }

    await sleep(Math.min(backoffDelay, BACKOFF_MAX_MS));
    backoffDelay = Math.min(backoffDelay * 2, BACKOFF_MAX_MS);
    onRestart();
    throwIfAborted(isAborted);

    try {
      offset = await fetchConfirmedOffset({ urlBase, uploadId });
    } catch (err) {
      if (err instanceof ResyncFailedError) {
        // The resync GET failed too — the outage is still on. Keep the offset we have and stay
        // in the loop: the next iteration re-POSTs the chunk, fails, backs off further, and
        // tries again. Only `retryBudget` above may end the upload.
        continue;
      }
      throw err;
    }
  }

  return offset;
}

/**
 * Calls `complete`, retrying on network/5xx failures the same way chunks do:
 * back off, then check server state via GET before retrying. A GET that
 * already carries `entityRef` means a *previous* `complete` response was
 * lost in transit but the server did finish — no need to re-POST.
 */
export async function completeUpload({ urlBase, uploadId, retryBudget, onRestart, isAborted, uploadRemainingChunks }) {
  let backoffDelay = BACKOFF_INITIAL_MS;
  let lastConflictOffset = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    throwIfAborted(isAborted);

    let result = null;
    try {
      result = await requestJson({ url: `${urlBase}/upload-session/${uploadId}/complete`, method: 'POST' }).promise;
    } catch (err) {
      if (err && err.aborted) {
        throw new AbortedError();
      }
      // network error — fall through to the shared retry-via-GET path below.
    }

    let failureInfo = { networkError: true };

    if (result) {
      const { status, body } = result;
      failureInfo = { status, body };

      if (status === 200) {
        retryBudget.noteSuccess();
        return body && body.entityRef;
      }
      if (status === 410) {
        throw new SessionExpiredError();
      }
      if (status === 409) {
        // As on the chunk path: a 409 from `ContentUploadCompletionInProgressException` (an
        // earlier `complete` is still running) has NO body at all, so `body.offset` must never be
        // dereferenced blindly.
        const next = body && typeof body.offset === 'number' ? body.offset : null;
        // No-progress guard: the same conflict offset twice in a row means `uploadRemainingChunks`
        // had nothing left to send (e.g. offset === size while the server finishes an earlier
        // `complete`), so re-POSTing straight away would hammer `complete` with no backoff.
        const repeated = next !== null && next === lastConflictOffset;
        if (next !== null) {
          lastConflictOffset = next;
        }
        if (next !== null && !repeated) {
          // A 409 is still a failed `complete` — it counts against the retry budget, so a server
          // that keeps conflicting cannot keep this loop alive forever. (Any chunk that actually
          // lands inside `uploadRemainingChunks` resets the budget, as it should.)
          if (retryBudget.noteFailure()) {
            throw new FatalUploadError({ status, body });
          }
          await uploadRemainingChunks(next);
          continue; // re-POST complete now that the missing chunks are in
        }
        // fall through to the shared backoff + GET resync path below
      } else if (status >= 400 && status < 500) {
        // 404 and any other unlisted 4xx are fatal.
        throw new FatalUploadError({ status, body });
      }
      // 5xx / unexpected / unproductive 409 — fall through to retry below.
    }

    if (retryBudget.noteFailure()) {
      throw new FatalUploadError(failureInfo);
    }

    await sleep(Math.min(backoffDelay, BACKOFF_MAX_MS));
    backoffDelay = Math.min(backoffDelay * 2, BACKOFF_MAX_MS);
    onRestart();
    throwIfAborted(isAborted);

    let statusBody;
    try {
      statusBody = await fetchSessionStatus({ urlBase, uploadId });
    } catch (err) {
      if (err instanceof ResyncFailedError) {
        // Same reasoning as in `uploadChunks`: the outage is still on, so loop back, re-POST
        // `complete`, and keep backing off instead of killing the upload.
        continue;
      }
      throw err;
    }

    if (statusBody.entityRef) {
      return statusBody.entityRef;
    }
    await uploadRemainingChunks(statusBody.offset);
    // loop back and retry POST complete
  }
}

/**
 * Runs one full chunked-session attempt (all remaining chunks + complete).
 * Throws `SessionExpiredError` (410) so the caller can perform exactly one
 * transparent re-init.
 */
export async function runChunkedSession({
  file,
  urlBase,
  uploadId,
  size,
  chunkSize,
  startOffset = 0,
  onChunkProgress,
  onRestart,
  onAuthError,
  isAborted,
  setActiveXhr
}) {
  const retryBudget = createRetryBudget();

  const uploadRemainingChunks = async fromOffset => {
    await uploadChunks({
      file,
      urlBase,
      uploadId,
      size,
      chunkSize,
      startOffset: fromOffset,
      retryBudget,
      onChunkProgress,
      onRestart,
      onAuthError,
      isAborted,
      setActiveXhr
    });
  };

  await uploadRemainingChunks(startOffset);

  return completeUpload({ urlBase, uploadId, retryBudget, onRestart, isAborted, uploadRemainingChunks });
}
