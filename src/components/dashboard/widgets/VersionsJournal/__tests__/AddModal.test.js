/**
 * `AddModal.handleChangeStatus`'s `ERROR_UPLOAD` branch (the version upload dialog) must show
 * the localised, limit-substituted text from `getChunkedUploadErrorMessage` in preference to the
 * chunked-upload module's raw, English-only `.message` (see that module's "Rejection contract").
 * `DropZone.test.js` uses the same pattern: the method is exercised directly on an instance.
 */
import { getChunkedUploadErrorMessage } from '@/helpers/chunkedUpload/messages';
import { FileStatuses } from '@/helpers/ecosXhr';

import AddModal from '../AddModal';

jest.mock('@/helpers/chunkedUpload/messages', () => ({
  getChunkedUploadErrorMessage: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

function makeInstance() {
  const instance = new AddModal({});
  instance.setState = newState => {
    instance.state = { ...instance.state, ...(typeof newState === 'function' ? newState(instance.state) : newState) };
  };
  return instance;
}

describe('AddModal.handleChangeStatus ERROR_UPLOAD', () => {
  it('uses the localised chunked-upload message instead of the raw response.message when reason is known', () => {
    getChunkedUploadErrorMessage.mockReturnValue('Too many uploads are already in progress. Please wait and try again');
    const instance = makeInstance();

    instance.handleChangeStatus(
      {
        status: FileStatuses.ERROR_UPLOAD,
        percent: 0,
        response: { message: 'Upload rejected: too-many-sessions', reason: 'too-many-sessions' }
      },
      {}
    );

    expect(getChunkedUploadErrorMessage).toHaveBeenCalledWith({
      message: 'Upload rejected: too-many-sessions',
      reason: 'too-many-sessions'
    });
    expect(instance.state.clientError).toBe('Too many uploads are already in progress. Please wait and try again');
    expect(instance.state.clientError).not.toContain('Upload rejected: too-many-sessions');
  });

  it('falls back to the existing generic message+description text when there is no known reason', () => {
    getChunkedUploadErrorMessage.mockReturnValue(undefined);
    const instance = makeInstance();

    instance.handleChangeStatus(
      {
        status: FileStatuses.ERROR_UPLOAD,
        percent: 0,
        response: { message: 'Upload failed: 500', status: { description: 'Internal error' } }
      },
      {}
    );

    expect(instance.state.clientError).toContain('Upload failed: 500');
    expect(instance.state.clientError).toContain('Internal error');
  });
});
