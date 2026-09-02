import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

/**
 * COREDEV-466: the Records gateway reports a failed request as HTTP 200 with an ERROR-level entry
 * in `messages`. On the main thread `@citeck/records-core` (`recordsApi.ts` → `checkRespMessages`)
 * turns that into a thrown Error, but that function is not exported and `recordsFetch` needs the
 * http adapter configured at app bootstrap — which this Worker (a separate JS context) never gets.
 * So the worker's raw fetches read `messages` here, with the same extraction rules.
 */

const FALLBACK_TEXT = 'Server error';

/** Text of the first ERROR-level message, or null when the response carries none. */
export function getRecordsErrorMessage(messages) {
  if (!Array.isArray(messages)) {
    return null;
  }

  const error = messages.find(message => message && message.level === 'ERROR');
  if (!error) {
    return null;
  }

  let text = error.msg || FALLBACK_TEXT;
  if (!isString(text)) {
    const raw = text;
    text = error.type === 'records-error' ? raw.msg : null;
    // `msg.msg` may be missing or itself an object: readable JSON beats "[object Object]".
    if (!isString(text) || !text) {
      text = isEmpty(raw) ? FALLBACK_TEXT : JSON.stringify(raw);
    }
  }

  return text || FALLBACK_TEXT;
}

/**
 * Normalises a fetch Response from the Records gateway into `{ ok, errorStatus, errorMessage, body }`.
 * `ok` is false for a non-2xx status OR an ERROR message. `errorStatus` is only set when the HTTP
 * status is the sole explanation: when a server text exists it is the better one, and forwarding
 * both would make UploadStatus.jsx add its generic notification on top of the text.
 */
export async function readRecordsResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    body = null;
  }

  const errorMessage = getRecordsErrorMessage(body && body.messages);
  const ok = response.ok && !errorMessage;

  return {
    ok,
    errorStatus: !response.ok && !errorMessage ? response.status : undefined,
    errorMessage,
    body
  };
}
