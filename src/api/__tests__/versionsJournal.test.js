// For an emodel record, VersionsJournalApi.addNewVersion uploads through the chunked-upload
// module to get a temp-file ref, then performs the same mutation
// ContentVersionController.handleFileUpload performs server-side: `_content` / `version:version`
// / `version:comment`. The legacy Alfresco branch (workspace://SpacesStore/ refs) is a single
// multipart POST to api/v2/citeck/upload via ecosXhr.
jest.mock('@/helpers/chunkedUpload', () => ({
  __esModule: true,
  uploadContent: jest.fn()
}));

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../helpers/ecosXhr', () => ({
  __esModule: true,
  default: jest.fn()
}));

import Records from '@citeck/records-core';

import ecosXhr from '../../helpers/ecosXhr';

import { uploadContent } from '@/helpers/chunkedUpload';

import { VersionsJournalApi } from '../versionsJournal';

describe('VersionsJournalApi.addNewVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('emodel record (not workspace://SpacesStore/)', () => {
    const makeRecordDouble = () => ({
      att: jest.fn(),
      save: jest.fn().mockResolvedValue({})
    });

    it('uploads through the chunked-upload module, then mutates _content/version:version/version:comment (minor)', async () => {
      uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });
      const recordDouble = makeRecordDouble();
      Records.get.mockReturnValue(recordDouble);

      const api = new VersionsJournalApi();
      const file = new File([new Uint8Array(10)], 'contract.docx');
      const handleProgress = jest.fn();

      const result = await api.addNewVersion({
        body: { record: 'emodel/uni-contract@abc', file, comment: 'minor fix', isMajor: false },
        handleProgress
      });

      expect(uploadContent).toHaveBeenCalledWith(file, { handleProgress });
      expect(Records.get).toHaveBeenCalledWith('emodel/uni-contract@abc');
      expect(recordDouble.att).toHaveBeenCalledWith('_content', 'emodel/temp-file@abc');
      expect(recordDouble.att).toHaveBeenCalledWith('version:version', '+0.1');
      expect(recordDouble.att).toHaveBeenCalledWith('version:comment', 'minor fix');
      expect(recordDouble.save).toHaveBeenCalledTimes(1);

      // Old-endpoint-shaped success response, so the existing saga's `result.status.code === 200`
      // check (src/sagas/versionsJournal.js) keeps working unmodified.
      expect(result).toEqual({ status: { code: 200, name: 'OK', description: 'File uploaded successfully' } });

      expect(ecosXhr).not.toHaveBeenCalled();
    });

    it('mutates version:version with +1.0 for a major version', async () => {
      uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@xyz' });
      const recordDouble = makeRecordDouble();
      Records.get.mockReturnValue(recordDouble);

      const api = new VersionsJournalApi();
      const file = new File([new Uint8Array(1)], 'x.txt');

      await api.addNewVersion({
        body: { record: 'emodel/uni-contract@abc', file, comment: 'major rewrite', isMajor: true },
        handleProgress: jest.fn()
      });

      expect(recordDouble.att).toHaveBeenCalledWith('version:version', '+1.0');
      expect(recordDouble.att).toHaveBeenCalledWith('version:comment', 'major rewrite');
    });

    it('propagates a rejection from uploadContent (e.g. UploadError) without touching Records', async () => {
      const rejection = new Error('Upload failed: 413');
      uploadContent.mockRejectedValue(rejection);

      const api = new VersionsJournalApi();
      const file = new File([new Uint8Array(10)], 'huge.bin');

      await expect(api.addNewVersion({ body: { record: 'emodel/uni-contract@abc', file, comment: '', isMajor: false } })).rejects.toBe(
        rejection
      );

      expect(Records.get).not.toHaveBeenCalled();
    });

    it('propagates a rejection from save() (e.g. server-side ACL/checkout enforcement) with its message intact', async () => {
      uploadContent.mockResolvedValue({ entityRef: 'emodel/temp-file@abc' });
      const saveError = new Error('Permission Denied');
      const recordDouble = {
        att: jest.fn(),
        save: jest.fn().mockRejectedValue(saveError)
      };
      Records.get.mockReturnValue(recordDouble);

      const api = new VersionsJournalApi();
      const file = new File([new Uint8Array(1)], 'x.txt');

      await expect(api.addNewVersion({ body: { record: 'emodel/uni-contract@abc', file, comment: '', isMajor: false } })).rejects.toBe(
        saveError
      );
    });
  });

  describe('legacy Alfresco record (workspace://SpacesStore/) — must stay on its current path', () => {
    it('still POSTs the given multipart form data to api/v2/citeck/upload via ecosXhr, and never touches uploadContent/Records', async () => {
      const legacyResponse = { nodeRef: 'workspace://SpacesStore/abc', status: { code: 200 } };
      ecosXhr.mockResolvedValue(legacyResponse);

      const formData = new FormData();
      const api = new VersionsJournalApi();
      const handleProgress = jest.fn();

      const result = await api.addNewVersion({
        body: { record: 'workspace://SpacesStore/abc', file: new File([], 'a.txt'), comment: 'c', isMajor: false, formData },
        handleProgress
      });

      expect(ecosXhr).toHaveBeenCalledTimes(1);
      const [url, options] = ecosXhr.mock.calls[0];
      expect(url).toContain('api/v2/citeck/upload');
      expect(options).toMatchObject({ method: 'POST', body: formData, handleProgress });

      expect(result).toBe(legacyResponse);
      expect(uploadContent).not.toHaveBeenCalled();
      expect(Records.get).not.toHaveBeenCalled();
    });

    it('propagates an ecosXhr rejection unchanged', async () => {
      const rejection = new Error('500 Internal Server Error');
      ecosXhr.mockRejectedValue(rejection);

      const api = new VersionsJournalApi();

      await expect(
        api.addNewVersion({
          body: {
            record: 'workspace://SpacesStore/abc',
            file: new File([], 'a.txt'),
            comment: '',
            isMajor: false,
            formData: new FormData()
          }
        })
      ).rejects.toBe(rejection);
    });
  });
});
