/**
 * `sagaAddNewVersion`'s catch block dispatches `addNewVersionError`, whose `.message` becomes
 * `AddModal.jsx`'s `errorMessage` prop — rendered right next to the `clientError` that
 * `handleChangeStatus` localises (see DropZone.test.js/AddModal.test.js). Both are fed by the
 * same `uploadContent` rejection, one via the `handleProgress` control-facade callback and one
 * via this saga's catch, so both must show the localised text; otherwise the dialog shows the
 * correct text glued to the raw "Upload rejected: <reason>" string.
 */
import { runSaga } from 'redux-saga';

import { addNewVersionError } from '../../actions/versionsJournal';
import { sagaAddNewVersion } from '../versionsJournal';

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

import { UploadError } from '@/helpers/chunkedUpload';
import { NotificationManager } from '@/services/notifications';

beforeEach(() => {
  jest.clearAllMocks();
});

function makeFile(name = 'big.pdf') {
  return new File(['x'], name, { type: 'application/pdf' });
}

async function runAddNewVersion(uploadError) {
  const api = {
    versionsJournal: {
      addNewVersion: jest.fn(async () => {
        throw uploadError;
      })
    }
  };
  const dispatched = [];
  const payload = {
    id: 'add-modal-1',
    record: 'emodel/contract@abc',
    file: makeFile(),
    comment: '',
    isMajor: false,
    handleProgress: jest.fn()
  };
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await runSaga({ dispatch: action => dispatched.push(action), getState: () => ({}) }, sagaAddNewVersion, { api }, { payload }).done;

  consoleErrorSpy.mockRestore();
  return dispatched;
}

describe('sagaAddNewVersion', () => {
  it('dispatches the raw .message on addNewVersionError when there is no known chunked-upload reason (unchanged behaviour)', async () => {
    const uploadError = new UploadError('Upload failed: 500', { status: 500 });

    const dispatched = await runAddNewVersion(uploadError);

    const errorAction = dispatched.find(a => a.type === addNewVersionError().type);
    expect(errorAction).toBeDefined();
    expect(errorAction.payload.message).toBe('Upload failed: 500');
    // The dialog's own generic toast is hardcoded and never reads `.message`.
    expect(NotificationManager.error).toHaveBeenCalledTimes(1);
  });

  it('dispatches the localised chunked-upload message (not the raw English .message) when the rejection carries a known reason', async () => {
    const uploadError = new UploadError('Upload rejected: max-size-exceeded', {
      type: 'chunked-upload-rejected',
      reason: 'max-size-exceeded',
      maxSingleUploadSize: 100,
      maxFileSize: 104857600
    });

    const dispatched = await runAddNewVersion(uploadError);

    const errorAction = dispatched.find(a => a.type === addNewVersionError().type);
    expect(errorAction).toBeDefined();
    expect(errorAction.payload.message).not.toBe('Upload rejected: max-size-exceeded');
    expect(errorAction.payload.message.length).toBeGreaterThan(0);
  });
});
