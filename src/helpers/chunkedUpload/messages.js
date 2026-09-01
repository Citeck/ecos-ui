/**
 * Localised, human-readable text for the chunked-upload module's structured rejections.
 *
 * `src/helpers/chunkedUpload/index.js` (`uploadContent`) always rejects with an `UploadError` —
 * see that module's "Rejection contract" doc header — whose `.message` is English and
 * unlocalised (it exists only as a readable fallback for callers that don't inspect the
 * structured fields). When a rejection's `reason` is one of the three the server can send on
 * `POST .../upload-session` (`storage-not-supported` | `max-size-exceeded` |
 * `too-many-sessions`), the UI must show a localised, limit-substituted message instead — never
 * the raw `.message` — at every point that displays an upload error (`DropZone.jsx`,
 * `AddModal.jsx` (version dialog), the formio `url` storage provider, the doc-lib worker's error
 * notification, and the AI Assistant file-upload hook).
 *
 * This module is intentionally NOT imported by `index.js`/`session.js`/`transport.js`/
 * `src/workers/docLib/worker.js` — those stay DOM-free / worker-safe (see `index.js`'s file
 * header). `t()`/`formatFileSize()` pull in i18next, which needs a real DOM; the doc-lib worker
 * instead forwards the raw `reason`/`maxSingleUploadSize`/`maxFileSize` fields (primitives —
 * structured-clone-safe, unlike the `UploadError` instance itself) to the main thread, which
 * calls `getChunkedUploadErrorMessage` there (see `UploadStatus.jsx`).
 */
import { formatFileSize, t } from '@/helpers/util';

// `maxSingleUploadSize` is the ceiling for a non-chunked (single-shot) upload/fallback — the
// relevant limit when the target storage doesn't support chunking at all. `maxFileSize` is the
// platform-wide ceiling — the relevant limit when the file itself is simply too big. Neither
// field is meaningful for `too-many-sessions` (a concurrency cap, not a size limit), so it has no
// `limitField` and always uses the no-limit text.
const REASON_SPECS = {
  'storage-not-supported': {
    withLimitKey: 'chunked-upload.error.storage-not-supported',
    noLimitKey: 'chunked-upload.error.storage-not-supported-no-limit',
    limitField: 'maxSingleUploadSize'
  },
  'max-size-exceeded': {
    withLimitKey: 'chunked-upload.error.max-size-exceeded',
    noLimitKey: 'chunked-upload.error.max-size-exceeded-no-limit',
    limitField: 'maxFileSize'
  },
  'too-many-sessions': {
    // No `noLimitKey`: `limitField: null` below makes `getChunkedUploadErrorMessage` return
    // `withLimitKey` unconditionally, so a second key here would just be dead code.
    withLimitKey: 'chunked-upload.error.too-many-sessions',
    limitField: null
  },
  // Not an init-time rejection reason but the one `uploadContent` synthesises itself when a
  // second 410 arrives after the single allowed transparent re-init (`index.js`'s
  // `SessionExpiredError` branch). Without an entry here it fell through to every consumer's
  // generic handler and renders as a bare "Ошибка загрузки файла" with an empty tail. No limit
  // is involved.
  'session-expired': {
    withLimitKey: 'chunked-upload.error.session-expired',
    limitField: null
  }
};

/**
 * The single-shot upload endpoint answers `413` with `{"error":"max-size-exceeded",
 * "maxSingleUploadSize":N}` (`SingleUploadSizeLimit.responseBody`, ecos-webapp-lib-spring) — the
 * same *situation* as an init-time `max-size-exceeded`, but expressed in a different vocabulary:
 * `error` instead of `reason`, and no `reason` field at all. Map it onto the same localised
 * message instead of leaving the user with the generic text.
 */
const SINGLE_SHOT_MAX_SIZE_ERROR = 'max-size-exceeded';

// `maxFileSize: -1` means "no limit" — must never be rendered as a byte count. Applied
// defensively to `maxSingleUploadSize` too, even though the server never sends -1 there.
function isRenderableLimit(value) {
  return typeof value === 'number' && isFinite(value) && value >= 0;
}

/**
 * Resolves whatever an upload consumer happens to be holding — an `UploadError`, the primitives
 * forwarded across a `postMessage` boundary, or the RAW server body `handleProgress` hands to
 * `DropZone.jsx`/`AddModal.jsx` — into `{reason, limit}`.
 * @param {*} err
 * @returns {{reason: string, limit: *}|undefined}
 */
function resolveReason(err) {
  if (!err || typeof err !== 'object') {
    return undefined;
  }

  const spec = err.reason && REASON_SPECS[err.reason];
  if (spec) {
    return { reason: err.reason, limit: spec.limitField ? err[spec.limitField] : undefined };
  }

  // A single-shot 413. Depending on the call site this is either the raw server body itself
  // (`handleProgress`'s `response`) or that body under `.body` (an `UploadError`) — check both.
  const bodies = [err, err.body];
  for (const body of bodies) {
    if (body && typeof body === 'object' && body.error === SINGLE_SHOT_MAX_SIZE_ERROR) {
      return { reason: SINGLE_SHOT_MAX_SIZE_ERROR, limit: body.maxSingleUploadSize };
    }
  }

  return undefined;
}

/**
 * @param {*} err an `UploadError` instance, any plain object carrying the same fields (e.g.
 *   forwarded across a `postMessage` boundary, which can't carry a real `Error`), or the raw
 *   server body from `handleProgress`
 * @returns {string|undefined} the localised message when the error maps onto a known reason,
 *   `undefined` otherwise (e.g. an HTTP failure with no reason at all, or no `err`) — callers
 *   fall back to their own existing generic handling.
 */
export function getChunkedUploadErrorMessage(err) {
  const resolved = resolveReason(err);
  if (!resolved) {
    return undefined;
  }

  const spec = REASON_SPECS[resolved.reason];

  if (!spec.limitField) {
    return t(spec.withLimitKey);
  }

  if (isRenderableLimit(resolved.limit)) {
    return t(spec.withLimitKey, { limit: formatFileSize(resolved.limit) });
  }
  return t(spec.noLimitKey);
}
