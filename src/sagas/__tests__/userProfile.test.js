import { runSaga } from 'redux-saga';

import { sagaChangePhoto } from '../userProfile';

// api.app.uploadFileV2 takes the raw file while the legacy api.app.uploadFile (alfresco nodeRefs)
// still takes a FormData, so sagaChangePhoto branches: it builds a FormData only for the legacy
// path and passes the raw file straight through for uploadFileV2.
jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

const runEnv = { dispatch: () => {}, getState: () => ({}) };

describe('userProfile sagas', () => {
  describe('sagaChangePhoto', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('uploads via api.app.uploadFileV2 with the raw file (not a FormData) for a new-platform record', async () => {
      const file = { name: 'avatar.png', size: 42 };
      const uploadFile = jest.fn();
      const uploadFileV2 = jest.fn(async () => ({ entityRef: 'emodel/temp-file@abc' }));
      const changePhoto = jest.fn(async () => ({ success: true }));
      const getUserDataByRef = jest.fn(async () => ({ thumbnail: 'thumb-url' }));

      const api = {
        app: { uploadFile, uploadFileV2 },
        user: { changePhoto, getUserDataByRef }
      };

      await runSaga(runEnv, sagaChangePhoto, { api }, { payload: { data: file, record: 'emodel/person@admin', stateId: 'sid' } }).done;

      expect(uploadFile).not.toHaveBeenCalled();
      expect(uploadFileV2).toHaveBeenCalledTimes(1);

      const [passedFile, passedOpts] = uploadFileV2.mock.calls[0];
      expect(passedFile).toBe(file);
      expect(passedFile instanceof FormData).toBe(false);
      expect(passedOpts).toEqual({ name: 'avatar.png' });

      expect(changePhoto).toHaveBeenCalledWith({
        record: 'emodel/person@admin',
        data: { size: 42, name: 'avatar.png', data: { entityRef: 'emodel/temp-file@abc' } }
      });
    });

    it('still uploads via api.app.uploadFile with a FormData for a legacy alfresco nodeRef', async () => {
      const file = { name: 'avatar.png', size: 42 };
      const uploadFile = jest.fn(async () => ({ entityRef: 'legacy-ref' }));
      const uploadFileV2 = jest.fn();
      const changePhoto = jest.fn(async () => ({ success: true }));
      const getUserDataByRef = jest.fn(async () => ({ thumbnail: 'thumb-url' }));

      const api = {
        app: { uploadFile, uploadFileV2 },
        user: { changePhoto, getUserDataByRef }
      };

      await runSaga(
        runEnv,
        sagaChangePhoto,
        { api },
        { payload: { data: file, record: 'workspace://SpacesStore/1234-5678', stateId: 'sid' } }
      ).done;

      expect(uploadFileV2).not.toHaveBeenCalled();
      expect(uploadFile).toHaveBeenCalledTimes(1);

      const [passedFormData] = uploadFile.mock.calls[0];
      expect(passedFormData instanceof FormData).toBe(true);
      expect(passedFormData.get('name')).toBe('avatar.png');
    });
  });
});
