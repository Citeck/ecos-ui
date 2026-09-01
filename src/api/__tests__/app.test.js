// AppApi.uploadFileV2 hands the raw file + metadata to the chunked-upload module's
// `uploadContent`, which decides single-shot vs chunked. This test covers only the delegation
// contract (args in, response/rejection out); the chunking decision itself is covered by
// src/helpers/chunkedUpload/__tests__.
jest.mock('@/helpers/chunkedUpload', () => ({
  __esModule: true,
  uploadContent: jest.fn()
}));

import { uploadContent } from '@/helpers/chunkedUpload';

import { AppApi } from '../app';

describe('AppApi.uploadFileV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to uploadContent with the raw file, metadata and handleProgress, and resolves with the response as-is', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });

    const api = new AppApi();
    const file = new File([new Uint8Array(10)], 'report.pdf');
    const callback = jest.fn();

    const result = await api.uploadFileV2(file, { ecosType: 'emodel/type@doc', workspace: 'ws1', name: 'custom.pdf' }, callback);

    expect(uploadContent).toHaveBeenCalledTimes(1);
    expect(uploadContent).toHaveBeenCalledWith(file, {
      ecosType: 'emodel/type@doc',
      workspace: 'ws1',
      name: 'custom.pdf',
      attributes: undefined,
      handleProgress: callback
    });
    expect(result).toEqual({ entityRef: 'emodel/temp-file@abc' });
  });

  it('works with no metadata/callback at all (matches how most current callers invoke it)', async () => {
    uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@bare' });

    const api = new AppApi();
    const file = new File([new Uint8Array(1)], 'plain.txt');

    const result = await api.uploadFileV2(file);

    expect(uploadContent).toHaveBeenCalledWith(file, {
      ecosType: undefined,
      workspace: undefined,
      name: undefined,
      attributes: undefined,
      handleProgress: undefined
    });
    expect(result).toEqual({ entityRef: 'emodel/temp-file@bare' });
  });

  it('propagates a rejection from uploadContent unchanged (e.g. chunked-upload-rejected)', async () => {
    const rejection = { type: 'chunked-upload-rejected', reason: 'max-size-exceeded', maxSingleUploadSize: 100, maxFileSize: 200 };
    uploadContent.mockRejectedValue(rejection);

    const api = new AppApi();
    const file = new File([new Uint8Array(10)], 'huge.bin');

    await expect(api.uploadFileV2(file, {})).rejects.toEqual(rejection);
  });
});
