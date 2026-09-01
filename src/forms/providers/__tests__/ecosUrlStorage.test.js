import { uploadContent, UploadError } from '@/helpers/chunkedUpload';

import ecosUrlStorage from '../ecosUrlStorage';

jest.mock('@/helpers/chunkedUpload', () => {
  const actual = jest.requireActual('@/helpers/chunkedUpload');
  return {
    __esModule: true,
    ...actual,
    uploadContent: jest.fn()
  };
});

// Matches src/helpers/urls.js:getDownloadContentUrl for a non-legacy (non `workspace://SpacesStore/`) entityRef.
const CONTENT_ENDPOINT = '/gateway/emodel/api/ecos/webapp/content';
const UPLOAD_URL = `${CONTENT_ENDPOINT}?containerTypeId=my-type`;

function makeFile({ size = 123, type = 'image/png' } = {}) {
  return { size, type };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ecosUrlStorage', () => {
  const provider = ecosUrlStorage();

  // `containerTypeId` must not become an `ecosType`. The server never reads that query param
  // (it appears nowhere in ecos-model or ecos-webapp-commons), so every formio attachment is
  // uploaded through `uploadImpl`'s `meta.ecosType.isEmpty()` branch → `uploadTempFile()`.
  // Sending it as a real `ecosType` would switch both paths (small single-shot files included)
  // to `uploadFile().withEcosType(...)`, creating a record of the container type at upload
  // time.
  it('does NOT send an ecosType, so both the single-shot and the chunked path keep temp-file semantics', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });

    await provider.uploadFile(makeFile(), 'file-abc.png', '', () => {}, UPLOAD_URL, undefined);

    expect(uploadContent).toHaveBeenCalledTimes(1);
    const [file, opts] = uploadContent.mock.calls[0];
    expect(file).toEqual(makeFile());
    expect(opts.ecosType).toBeUndefined();
    expect('ecosType' in opts).toBe(false);
    expect(opts.name).toBe('file-abc.png');
    expect(typeof opts.handleProgress).toBe('function');
  });

  it('derives urlBase from the default File.js-generated url (path without the query string) — same target as before', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });

    await provider.uploadFile(makeFile(), 'file-abc.png', '', () => {}, UPLOAD_URL, undefined);

    const [, opts] = uploadContent.mock.calls[0];
    expect(opts.urlBase).toBe(CONTENT_ENDPOINT);
  });

  it('honours a form-configured non-default upload url (the "Url" field on storage type url) as urlBase, not the module default', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });
    const customUrl = 'https://custom.example.com/some/other/upload/path?containerTypeId=my-type';

    await provider.uploadFile(makeFile(), 'file-abc.png', '', () => {}, customUrl, undefined);

    const [, opts] = uploadContent.mock.calls[0];
    expect(opts.urlBase).toBe('https://custom.example.com/some/other/upload/path');
    expect(opts.urlBase).not.toBe(CONTENT_ENDPOINT);
    // ...and still no ecosType, whatever the url's containerTypeId says (see above).
    expect(opts.ecosType).toBeUndefined();
  });

  it('strips a single trailing slash from a form-configured upload url so uploadContent does not produce a double slash', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });
    const customUrlWithTrailingSlash = 'https://custom.example.com/some/other/upload/path/?containerTypeId=my-type';

    await provider.uploadFile(makeFile(), 'file-abc.png', '', () => {}, customUrlWithTrailingSlash, undefined);

    const [, opts] = uploadContent.mock.calls[0];
    expect(opts.urlBase).toBe('https://custom.example.com/some/other/upload/path');
  });

  it('falls back to the module default urlBase when uploadFile is given an empty url', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });

    await provider.uploadFile(makeFile(), 'file-abc.png', '', () => {}, '', undefined);

    const [, opts] = uploadContent.mock.calls[0];
    expect(opts.urlBase).toBeUndefined();
  });

  it('resolves with exactly the same field-value shape as the stock url provider ({storage, name, url, size, type, data:{entityRef}})', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });

    const file = makeFile({ size: 999, type: 'application/pdf' });
    const result = await provider.uploadFile(file, 'report-abc.pdf', '', () => {}, UPLOAD_URL, undefined);

    expect(result).toEqual({
      storage: 'url',
      name: 'report-abc.pdf',
      url: `${CONTENT_ENDPOINT}?ref=emodel/temp-file@abc&download=true`,
      size: 999,
      type: 'application/pdf',
      data: { entityRef: 'emodel/temp-file@abc' }
    });
    expect(Object.keys(result).sort()).toEqual(['data', 'name', 'size', 'storage', 'type', 'url'].sort());
  });

  it('adapts handleProgress(state, facade) calls into formio progressCallback({loaded, total}) calls', async () => {
    let capturedHandleProgress;
    uploadContent.mockImplementation((file, opts) => {
      capturedHandleProgress = opts.handleProgress;
      return Promise.resolve({ entityRef: 'emodel/temp-file@abc' });
    });

    const progressCallback = jest.fn();
    await provider.uploadFile(makeFile(), 'f.png', '', progressCallback, UPLOAD_URL, undefined);

    capturedHandleProgress({ status: 'uploading', percent: 42 }, {});
    expect(progressCallback).toHaveBeenCalledWith({ loaded: 42, total: 100 });

    capturedHandleProgress({ status: 'done', percent: 100 }, {});
    expect(progressCallback).toHaveBeenCalledWith({ loaded: 100, total: 100 });
  });

  it('rejects with the UploadError message (readable by formio own error handling) rather than the raw error object, when there is no known chunked-upload reason', async () => {
    // No `reason` field (e.g. a plain HTTP failure) — nothing to localise, so the raw
    // `.message` is what formio's File component ends up displaying.
    const err = new UploadError('Upload failed: 500', { status: 500 });
    uploadContent.mockRejectedValue(err);

    await expect(provider.uploadFile(makeFile(), 'f.png', '', () => {}, UPLOAD_URL, undefined)).rejects.toBe('Upload failed: 500');
  });

  it('rejects with the localised chunked-upload message (not the raw English .message) when the rejection carries a known reason', async () => {
    // `err.message` is English/unlocalised (see chunkedUpload/index.js's "Rejection
    // contract") — whenever `reason` is one of the three the server can send, the localised text
    // from getChunkedUploadErrorMessage must win instead.
    const err = new UploadError('Upload rejected: max-size-exceeded', {
      reason: 'max-size-exceeded',
      maxSingleUploadSize: 100,
      maxFileSize: 104857600
    });
    uploadContent.mockRejectedValue(err);

    const rejection = await provider
      .uploadFile(makeFile(), 'f.png', '', () => {}, UPLOAD_URL, undefined)
      .then(
        () => Promise.reject(new Error('expected uploadFile to reject')),
        rejectionValue => rejectionValue
      );

    expect(rejection).not.toBe('Upload rejected: max-size-exceeded');
    expect(typeof rejection).toBe('string');
    expect(rejection.length).toBeGreaterThan(0);
  });

  it('downloadFile resolves the file unchanged (ecos never sets file.private — same as the stock provider non-private branch)', async () => {
    const file = { storage: 'url', name: 'f.png', url: '/some/url', size: 1, type: 'image/png', data: { entityRef: 'x' } };
    await expect(provider.downloadFile(file)).resolves.toBe(file);
  });
});

describe('Formio provider registration', () => {
  it('registers ecosUrlStorage under the "url" key, keeping base64 untouched, so existing forms need no reconfiguration', async () => {
    jest.resetModules();
    const FormioModule = await import('../../Formio');
    const Formio = FormioModule.default;
    const ecosUrlStorageModule = (await import('../ecosUrlStorage')).default;

    expect(Formio.providers.storage.url).toBe(ecosUrlStorageModule);
    expect(Formio.providers.storage.base64).toBeDefined();
    expect(Formio.providers.storage.url).not.toBe(Formio.providers.storage.base64);
  });
});
