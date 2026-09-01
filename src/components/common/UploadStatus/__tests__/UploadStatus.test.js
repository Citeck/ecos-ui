/**
 * `UploadStatus`'s `WORKER_STATUSES.UPLOAD_ERROR` handler is the doc-lib Web Worker's
 * error-display point on the main thread (the worker itself is DOM-free and cannot localise). It
 * must show the localised text from `getChunkedUploadErrorMessage` whenever `errorReason`
 * (relayed from worker.js via sagas/docLib.js) is one of the three known chunked-upload-rejected
 * reasons; a coarse "413 → size error, else → generic" rule shows no notification at all for
 * those, since they never carry an HTTP `errorStatus`.
 *
 * The component early-returns `null` whenever `totalCountFiles` is falsy, so these tests omit
 * `totalCount`/`successFileCount` from the simulated message: the render tree stays `null` and
 * the test exercises only the `navigator.serviceWorker` message-listener side effect.
 */
import { act, render } from '@testing-library/react';
import React from 'react';

import { getChunkedUploadErrorMessage } from '@/helpers/chunkedUpload/messages';
import { NotificationManager } from '@/services/notifications';
import { SERVICE_WORKER_TYPES, WORKER_STATUSES } from '@/workers/docLib/constants';

import UploadStatus from '../UploadStatus';

jest.mock('@/helpers/chunkedUpload/messages', () => ({
  getChunkedUploadErrorMessage: jest.fn()
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: { error: jest.fn(), success: jest.fn() }
}));

jest.mock('@/helpers/util', () => {
  const actual = jest.requireActual('@/helpers/util');
  return {
    ...actual,
    t: jest.fn((key, options) => (options ? `${key}::${JSON.stringify(options)}` : key))
  };
});

let messageListener;
let originalServiceWorker;

beforeEach(() => {
  jest.clearAllMocks();
  originalServiceWorker = navigator.serviceWorker;
  messageListener = undefined;
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      addEventListener: jest.fn((type, cb) => {
        if (type === 'message') {
          messageListener = cb;
        }
      }),
      removeEventListener: jest.fn()
    }
  });
});

afterEach(() => {
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: originalServiceWorker });
});

function dispatchUploadError(data) {
  act(() => {
    messageListener({ data: { type: SERVICE_WORKER_TYPES.PROGRESS, status: WORKER_STATUSES.UPLOAD_ERROR, ...data } });
  });
}

describe('UploadStatus WORKER_STATUSES.UPLOAD_ERROR', () => {
  it('shows the localised chunked-upload message when errorReason is a known reason, even with no errorStatus', () => {
    getChunkedUploadErrorMessage.mockReturnValue('The file exceeds the maximum allowed size (200 MB)');
    render(<UploadStatus />);
    expect(typeof messageListener).toBe('function');

    dispatchUploadError({
      errorReason: 'max-size-exceeded',
      errorMaxSingleUploadSize: 100,
      errorMaxFileSize: 209715200,
      file: { file: { name: 'big.pdf' }, isLoading: false, isError: true },
      isCancelled: false
    });

    expect(getChunkedUploadErrorMessage).toHaveBeenCalledWith({
      reason: 'max-size-exceeded',
      maxSingleUploadSize: 100,
      maxFileSize: 209715200
    });
    expect(NotificationManager.error).toHaveBeenCalledWith(
      'document-library.uploading-file.message.chunked-error::{"fileName":"big.pdf","reasonMessage":"The file exceeds the maximum allowed size (200 MB)"}'
    );
  });

  it('falls back to the existing errorStatus-keyed messages when there is no known reason', () => {
    getChunkedUploadErrorMessage.mockReturnValue(undefined);
    render(<UploadStatus />);

    dispatchUploadError({
      errorStatus: 413,
      file: { file: { name: 'huge.zip' }, isLoading: false, isError: true },
      isCancelled: false
    });

    expect(NotificationManager.error).toHaveBeenCalledWith('document-library.uploading-file.message.size-error::{"fileName":"huge.zip"}');
  });

  it('shows no notification when there is neither a known reason nor an errorStatus (unchanged pre-existing behaviour)', () => {
    getChunkedUploadErrorMessage.mockReturnValue(undefined);
    render(<UploadStatus />);

    dispatchUploadError({
      file: { file: { name: 'ghost.txt' }, isLoading: false, isError: true },
      isCancelled: false
    });

    expect(NotificationManager.error).not.toHaveBeenCalled();
  });
});
