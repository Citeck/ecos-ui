/**
 * Low-level, DOM-free XHR primitives used by the chunked upload client.
 *
 * No `window`/`document` access here — this module is imported by a
 * dedicated Web Worker, where only `XMLHttpRequest`, `Blob`/`File` and
 * timers are available.
 *
 * Every primitive resolves `{ status, body, xhr }` for ANY HTTP response,
 * including 4xx/5xx — callers decide what is fatal, retryable, etc.
 * Only transport-level failures reject:
 *   - `{ networkError: true, message }` for `onerror`/`ontimeout`
 *   - `{ aborted: true }` for `onabort`
 *
 * Each primitive returns `{ xhr, promise }` so callers can keep a handle on
 * the in-flight request (needed to implement `abort()`).
 *
 * Every request also carries `X-Requested-With: XMLHttpRequest` and
 * `Accept-Language`, exactly like `src/helpers/ecosXhr.js`. `X-Requested-With`
 * in particular is the conventional marker that makes a Spring Security
 * stack answer 401 JSON instead of redirecting to an HTML login page, so it
 * is not optional. `getCurrentLocale` is imported from the leaf
 * `helpers/export/util` module (not the much heavier `helpers/util`, which
 * pulls in `ESMRequire`/other main-thread-only machinery) — it and the
 * `getCookie` it calls both guard on `typeof window/document === 'undefined'`
 * and fall back to the `en` locale, so it is safe to call from a Worker.
 */
import { getCurrentLocale } from '../export/util';

function parseBody(xhr) {
  const text = xhr.responseText;

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/**
 * @param {Object} params
 * @param {string} params.method
 * @param {string} params.url
 * @param {*} [params.body] anything XMLHttpRequest#send accepts (string, Blob, FormData, ...)
 * @param {Object} [params.headers]
 * @param {function(number, number): void} [params.onUploadProgress] (loaded, total)
 * @returns {{ xhr: XMLHttpRequest, promise: Promise<{status: number, body: *, xhr: XMLHttpRequest}> }}
 */
export function xhrRequest({ method, url, body, headers = {}, onUploadProgress } = {}) {
  const xhr = new XMLHttpRequest();

  const promise = new Promise((resolve, reject) => {
    xhr.open(method, url, true);

    // These two always win over any caller-supplied header of the same name,
    // exactly like ecosXhr.js's own header merge.
    const finalHeaders = {
      ...headers,
      'Accept-Language': getCurrentLocale(),
      'X-Requested-With': 'XMLHttpRequest'
    };
    Object.keys(finalHeaders).forEach(name => {
      xhr.setRequestHeader(name, finalHeaders[name]);
    });

    // Matches ecosXhr.js: send cookies/credentials for absolute (cross-origin
    // capable) URLs, not for same-origin relative ones.
    if (url && url.includes('http')) {
      xhr.withCredentials = true;
    }

    if (onUploadProgress) {
      xhr.upload.onprogress = e => {
        const total = e.lengthComputable ? e.total : (body && body.size) || 0;
        onUploadProgress(e.loaded, total);
      };
    }

    xhr.onload = () => {
      resolve({ status: xhr.status, body: parseBody(xhr), xhr });
    };
    xhr.onerror = () => reject({ networkError: true, message: 'network error' });
    xhr.ontimeout = () => reject({ networkError: true, message: 'timeout' });
    xhr.onabort = () => reject({ aborted: true });

    xhr.send(body);
  });

  return { xhr, promise };
}

/**
 * JSON request/response helper. `json` (if provided) is stringified and sent
 * with an explicit `application/json` content type. A request without a body
 * (e.g. GET, DELETE) sends nothing.
 */
export function requestJson({ url, method = 'GET', json } = {}) {
  const headers = {};
  let body;

  if (json !== undefined) {
    body = JSON.stringify(json);
    headers['Content-Type'] = 'application/json;charset=UTF-8';
  }

  return xhrRequest({ method, url, body, headers });
}

/**
 * Uploads a single chunk as raw bytes. The endpoint is declared
 * `consumes = application/octet-stream`; a `Blob` produced by `File.slice()`
 * inherits the *file's* mime type, so the header MUST be set explicitly here
 * or the server answers 415 and every chunk fails.
 */
export function uploadChunk({ url, blob, onUploadProgress }) {
  return xhrRequest({
    method: 'POST',
    url,
    body: blob,
    headers: { 'Content-Type': 'application/octet-stream' },
    onUploadProgress
  });
}

/**
 * Single-shot (non-chunked) upload of a FormData body — the existing path
 * used for small files / storages without chunking support. No explicit
 * Content-Type: the browser sets the multipart boundary itself, exactly like
 * the FormData path in `AppApi.uploadFileV2`.
 */
export function uploadFormData({ url, formData, onUploadProgress }) {
  return xhrRequest({ method: 'POST', url, body: formData, onUploadProgress });
}
