/**
 * `getChunkedUploadErrorMessage` turns an `UploadError`'s structured `reason`
 * (storage-not-supported / max-size-exceeded / too-many-sessions — see chunkedUpload/index.js's
 * "Rejection contract") into a localised, limit-substituted message, in preference to the
 * module's raw English `.message`.
 *
 * `t`/`formatFileSize` are mocked so these tests pin down exactly which i18n key and params each
 * reason produces, independent of whether i18next itself is initialised (it isn't, in jest — see
 * ecosUrlStorage.test.js for the alternative, un-mocked, "just prove it differs from the raw
 * message" style of assertion).
 */
import { formatFileSize, t } from '@/helpers/util';

import { getChunkedUploadErrorMessage } from '../messages';

jest.mock('@/helpers/util', () => ({
  t: jest.fn((key, options) => (options ? `${key}::${JSON.stringify(options)}` : key)),
  formatFileSize: jest.fn(bytes => `${bytes}bytes-formatted`)
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getChunkedUploadErrorMessage', () => {
  it('returns undefined for a falsy/undefined error', () => {
    expect(getChunkedUploadErrorMessage(undefined)).toBeUndefined();
    expect(getChunkedUploadErrorMessage(null)).toBeUndefined();
  });

  it('returns undefined when there is no reason at all (e.g. a plain HTTP failure)', () => {
    expect(getChunkedUploadErrorMessage({ status: 500 })).toBeUndefined();
    expect(t).not.toHaveBeenCalled();
  });

  it('returns undefined for an unknown reason', () => {
    expect(getChunkedUploadErrorMessage({ reason: 'something-new-the-ui-does-not-know' })).toBeUndefined();
    expect(t).not.toHaveBeenCalled();
  });

  // `uploadContent` synthesises `reason: 'session-expired'` itself when a second 410 arrives
  // after the one allowed transparent re-init. Without a key here DropZone renders a bare
  // "Ошибка загрузки файла" with an empty tail.
  it('session-expired: has its own localised text and never substitutes a limit', () => {
    const message = getChunkedUploadErrorMessage({ reason: 'session-expired' });

    expect(formatFileSize).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith('chunked-upload.error.session-expired');
    expect(message).toBe('chunked-upload.error.session-expired');
  });

  it('storage-not-supported: substitutes maxSingleUploadSize, formatted human-readable', () => {
    const message = getChunkedUploadErrorMessage({ reason: 'storage-not-supported', maxSingleUploadSize: 104857600, maxFileSize: -1 });

    expect(formatFileSize).toHaveBeenCalledWith(104857600);
    expect(t).toHaveBeenCalledWith('chunked-upload.error.storage-not-supported', { limit: '104857600bytes-formatted' });
    expect(message).toBe('chunked-upload.error.storage-not-supported::{"limit":"104857600bytes-formatted"}');
  });

  it('storage-not-supported: falls back to the no-limit text when maxSingleUploadSize is missing/invalid', () => {
    const message = getChunkedUploadErrorMessage({ reason: 'storage-not-supported' });

    expect(formatFileSize).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith('chunked-upload.error.storage-not-supported-no-limit');
    expect(message).toBe('chunked-upload.error.storage-not-supported-no-limit');
  });

  it('max-size-exceeded: substitutes maxFileSize, formatted human-readable', () => {
    const message = getChunkedUploadErrorMessage({ reason: 'max-size-exceeded', maxSingleUploadSize: 100, maxFileSize: 209715200 });

    expect(formatFileSize).toHaveBeenCalledWith(209715200);
    expect(t).toHaveBeenCalledWith('chunked-upload.error.max-size-exceeded', { limit: '209715200bytes-formatted' });
    expect(message).toBe('chunked-upload.error.max-size-exceeded::{"limit":"209715200bytes-formatted"}');
  });

  it('max-size-exceeded: -1 ("no limit") is never rendered as a size — falls back to the no-limit text', () => {
    const message = getChunkedUploadErrorMessage({ reason: 'max-size-exceeded', maxFileSize: -1 });

    expect(formatFileSize).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith('chunked-upload.error.max-size-exceeded-no-limit');
    expect(message).toBe('chunked-upload.error.max-size-exceeded-no-limit');
  });

  it('too-many-sessions: never substitutes a size (it is a concurrency cap, not a size limit)', () => {
    const message = getChunkedUploadErrorMessage({ reason: 'too-many-sessions', maxSingleUploadSize: 100, maxFileSize: 200 });

    expect(formatFileSize).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith('chunked-upload.error.too-many-sessions');
    expect(message).toBe('chunked-upload.error.too-many-sessions');
  });

  // The single-shot path's 413 speaks a different vocabulary —
  // `{"error":"max-size-exceeded","maxSingleUploadSize":N}` (SingleUploadSizeLimit.responseBody),
  // with no `reason` field at all — but it is the same situation as an init-time
  // max-size-exceeded and must produce the same localised text, not the generic fallback.
  describe('single-shot 413 body ({error: "max-size-exceeded"}, no `reason`)', () => {
    it('maps the raw body handleProgress passes to DropZone/AddModal onto the max-size-exceeded text', () => {
      const message = getChunkedUploadErrorMessage({ error: 'max-size-exceeded', maxSingleUploadSize: 209715200 });

      expect(formatFileSize).toHaveBeenCalledWith(209715200);
      expect(t).toHaveBeenCalledWith('chunked-upload.error.max-size-exceeded', { limit: '209715200bytes-formatted' });
      expect(message).toBe('chunked-upload.error.max-size-exceeded::{"limit":"209715200bytes-formatted"}');
    });

    it('maps the same body when it arrives nested on an UploadError as `.body` (the rejected-promise consumers)', () => {
      const message = getChunkedUploadErrorMessage({
        status: 413,
        body: { error: 'max-size-exceeded', maxSingleUploadSize: 209715200 }
      });

      expect(t).toHaveBeenCalledWith('chunked-upload.error.max-size-exceeded', { limit: '209715200bytes-formatted' });
      expect(message).toBe('chunked-upload.error.max-size-exceeded::{"limit":"209715200bytes-formatted"}');
    });

    it('falls back to the no-limit text when the 413 body carries no usable size', () => {
      const message = getChunkedUploadErrorMessage({ status: 413, body: { error: 'max-size-exceeded' } });

      expect(formatFileSize).not.toHaveBeenCalled();
      expect(message).toBe('chunked-upload.error.max-size-exceeded-no-limit');
    });

    it('leaves an unrelated error body alone', () => {
      expect(getChunkedUploadErrorMessage({ status: 500, body: { error: 'something-else' } })).toBeUndefined();
      expect(t).not.toHaveBeenCalled();
    });
  });

  it('works on a plain object forwarded across a postMessage boundary, not just a real UploadError instance', () => {
    // Structured-clone-safe shape worker.js actually sends (see worker.js/UploadStatus.jsx) —
    // no Error prototype, just the primitive fields.
    const plainRejection = { reason: 'too-many-sessions' };

    expect(getChunkedUploadErrorMessage(plainRejection)).toBe('chunked-upload.error.too-many-sessions');
  });
});
