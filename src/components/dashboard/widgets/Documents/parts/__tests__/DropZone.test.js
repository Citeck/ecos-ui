/**
 * `DropZone.handleChangeStatus`'s `ERROR_UPLOAD` branch must show the localised,
 * limit-substituted text from `getChunkedUploadErrorMessage` in preference to the chunked-upload
 * module's raw, English-only `.message` (see that module's "Rejection contract").
 *
 * Exercises `handleChangeStatus` directly on a component instance rather than through a full
 * react-dropzone render: it is a plain method that only touches `this.state`/`this.props`.
 */
import { getChunkedUploadErrorMessage } from '@/helpers/chunkedUpload/messages';
import { FileStatuses } from '@/helpers/ecosXhr';

import DropZone from '../DropZone';

jest.mock('@/helpers/chunkedUpload/messages', () => ({
  getChunkedUploadErrorMessage: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

function makeInstance() {
  const instance = new DropZone({ onSelect: () => {}, onUploaded: () => {} });
  instance.setState = newState => {
    instance.state = { ...instance.state, ...(typeof newState === 'function' ? newState(instance.state) : newState) };
  };
  return instance;
}

describe('DropZone.handleChangeStatus ERROR_UPLOAD', () => {
  it('uses the localised chunked-upload message instead of the raw response.message when reason is known', () => {
    getChunkedUploadErrorMessage.mockReturnValue('The file exceeds the maximum allowed size (100 MB)');
    const instance = makeInstance();
    const xhr = { onerror: jest.fn() };

    instance.handleChangeStatus(
      {
        status: FileStatuses.ERROR_UPLOAD,
        percent: 0,
        response: { message: 'Upload rejected: max-size-exceeded', reason: 'max-size-exceeded', maxFileSize: 104857600 }
      },
      xhr
    );

    expect(getChunkedUploadErrorMessage).toHaveBeenCalledWith({
      message: 'Upload rejected: max-size-exceeded',
      reason: 'max-size-exceeded',
      maxFileSize: 104857600
    });
    expect(instance.state.clientError).toBe('The file exceeds the maximum allowed size (100 MB)');
    expect(instance.state.clientError).not.toContain('Upload rejected: max-size-exceeded');
  });

  it('falls back to the existing generic message+description text when there is no known reason', () => {
    getChunkedUploadErrorMessage.mockReturnValue(undefined);
    const instance = makeInstance();
    const xhr = { onerror: jest.fn() };

    instance.handleChangeStatus(
      {
        status: FileStatuses.ERROR_UPLOAD,
        percent: 0,
        response: { message: 'Upload failed: 500', status: { description: 'Internal error' } }
      },
      xhr
    );

    expect(instance.state.clientError).toContain('Upload failed: 500');
    expect(instance.state.clientError).toContain('Internal error');
  });
});
