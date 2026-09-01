import { DOC_PREVIEW_TEXT_MAX_BYTES } from '@citeck/constants';

const textEncoder = new TextEncoder();
// fatal=false so that a prefix cut in the middle of a multibyte character decodes instead of throwing
const textDecoder = new TextDecoder('utf-8', { fatal: false });

/**
 * Cuts `text` down to `maxBytes` bytes, not characters, and says whether anything was cut. Used for
 * a body the server sent whole - a truncation the server did is reported by its status instead.
 */
export function truncateByBytes(text, maxBytes) {
  const bytes = textEncoder.encode(text);

  if (bytes.length <= maxBytes) {
    return { content: text, isTruncated: false };
  }

  const decoded = textDecoder.decode(bytes.subarray(0, maxBytes));
  // the cut may have landed inside a character, which decodes to a trailing replacement char
  const content = decoded.endsWith('�') ? decoded.slice(0, -1) : decoded;

  return { content, isTruncated: true };
}

/**
 * Loads at most `maxBytes` of the text behind `src`, for the viewers that show a file as text.
 *
 * The range is asked for rather than imposed afterwards: a server that honours it answers `206` and
 * a hundred-megabyte log costs the two megabytes actually shown instead of the whole file, which is
 * the difference between a preview and a download. A server that does not honour it answers `200`
 * with everything, and the cut happens here as it always has - so the two answers differ in what
 * crosses the network, not in what is displayed.
 *
 * @param {string} src url of the content
 * @param {Object} [options]
 * @param {number} [options.maxBytes] how much of it to show
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ content: string, isTruncated: boolean }>}
 */
export async function loadTextContent(src, { maxBytes = DOC_PREVIEW_TEXT_MAX_BYTES, signal } = {}) {
  const response = await fetch(src, { signal, headers: { Range: `bytes=0-${maxBytes - 1}` } });

  // the range lies beyond the end of an empty content; there is nothing to show and nothing wrong
  if (response.status === 416) {
    return { content: '', isTruncated: false };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();

  if (response.status === 206) {
    // the server cut it for us, and it only cut it if there was more; whether the last character
    // survived the cut is still ours to answer, so the same truncation runs over what arrived
    return { content: truncateByBytes(text, maxBytes).content, isTruncated: isPartialOfLargerContent(response, maxBytes) };
  }

  return truncateByBytes(text, maxBytes);
}

/**
 * Whether a `206` is a piece of something longer, read off `Content-Range: bytes 0-<last>/<total>`.
 * A server may answer `206` with the whole content when the range covers all of it, and a viewer
 * that announced "shortened, download it to see the rest" there would be lying.
 */
function isPartialOfLargerContent(response, maxBytes) {
  const contentRange = response.headers.get('Content-Range') || '';
  const total = Number.parseInt(contentRange.split('/')[1], 10);

  return Number.isFinite(total) ? total > maxBytes : true;
}
