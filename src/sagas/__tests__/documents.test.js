import { runSaga } from 'redux-saga';

import { setDocumentsByTypes } from '../../actions/documents';
import documentsReducer from '../../reducers/documents';
import { sagaGetDynamicTypes, sagaUploadFiles, uploadFileV2 } from '../documents';

jest.mock('@/components/journals/Journals/service', () => ({
  __esModule: true,
  default: {
    getJournalConfig: jest.fn(async () => ({ columns: [] })),
    resolveColumns: jest.fn(async (columns = []) => columns)
  }
}));

jest.mock('@/components/core/Records/actions', () => ({
  __esModule: true,
  default: {
    getActionsForRecords: jest.fn(async () => ({ forRecord: {} }))
  }
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

import { UploadError } from '@/helpers/chunkedUpload';
import { NotificationManager } from '@/services/notifications';

const stateId = 'documents-widget-state-id';
const record = 'emodel/uni-contract@test-record';

const TYPE_A = 'emodel/type@scanned-documents';
const TYPE_B = 'emodel/type@ess-reports';

const makeState = () => ({
  documents: {
    [stateId]: {
      config: {
        isLoadChecklist: false,
        types: [{ type: TYPE_A }, { type: TYPE_B }]
      },
      dynamicTypes: [],
      documentsByTypes: {},
      availableTypes: [],
      actions: {}
    }
  }
});

const makeApi = documentsPerType => ({
  documents: {
    getDynamicTypes: jest.fn(async () => ({ records: [], errors: [] })),
    getDocumentsByTypes: jest.fn(async () => ({
      records: documentsPerType.map(documents => ({ documents })),
      errors: []
    })),
    getTypeInfo: jest.fn(async () => documentsPerType.map(() => ({}))),
    getFormIdByType: jest.fn(async () => null),
    getColumnsConfigByType: jest.fn(async () => ({ columns: [] })),
    getParent: jest.fn(async () => ({}))
  }
});

/**
 * Runs the initial load of the documents widget (the saga behind `initStore`)
 * and returns every dispatched action plus the resulting widget state.
 */
const runInitialLoad = async documentsPerType => {
  const dispatched = [];
  const api = makeApi(documentsPerType);

  await runSaga(
    {
      dispatch: action => dispatched.push(action),
      getState: makeState
    },
    sagaGetDynamicTypes,
    { api },
    { payload: { key: stateId, record } }
  ).done;

  const state = dispatched.reduce((acc, action) => documentsReducer(acc, action), undefined);

  return { dispatched, api, widgetState: state[stateId] || {} };
};

/**
 * Reproduces what `DesktopDocuments.recalcDownloadIds` does while "All types" is selected:
 * the list of refs passed to the "Download all documents" button.
 */
const downloadIdsFor = documentsByTypes => {
  if (!documentsByTypes) {
    return null;
  }

  return Object.values(documentsByTypes)
    .reduce((result, current) => result.concat(current), [])
    .map(document => document.recordRef);
};

console.error = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe('documents sagas tests', () => {
  describe('sagaGetDynamicTypes saga', () => {
    it('should publish documentsByTypes on the initial load, so "download all" has refs without switching types', async () => {
      const { dispatched, api, widgetState } = await runInitialLoad([
        [{ recordRef: 'doc@1', __id: 'doc@1' }],
        [
          { recordRef: 'doc@2', __id: 'doc@2' },
          { recordRef: 'doc@3', __id: 'doc@3' }
        ]
      ]);

      const setDocuments = dispatched.filter(action => action.type === setDocumentsByTypes().type);

      expect(setDocuments).toHaveLength(1);
      expect(widgetState.documentsByTypes).toEqual({
        [TYPE_A]: [{ recordRef: 'doc@1', __id: 'doc@1' }],
        [TYPE_B]: [
          { recordRef: 'doc@2', __id: 'doc@2' },
          { recordRef: 'doc@3', __id: 'doc@3' }
        ]
      });
      expect(downloadIdsFor(widgetState.documentsByTypes)).toEqual(['doc@1', 'doc@2', 'doc@3']);
      // and it must come from the documents already fetched for the type counters — no extra round trip
      expect(api.documents.getDocumentsByTypes).toHaveBeenCalledTimes(1);
    });

    it('should keep documentsByTypes empty per type when the record has no documents at all', async () => {
      const { widgetState } = await runInitialLoad([[], []]);

      expect(widgetState.documentsByTypes).toEqual({ [TYPE_A]: [], [TYPE_B]: [] });
      expect(downloadIdsFor(widgetState.documentsByTypes)).toEqual([]);
    });
  });

  // api.app.uploadFileV2 routes through the chunked-upload module, so the saga passes the raw
  // File plus metadata and builds no FormData.
  describe('uploadFileV2 saga', () => {
    const runEnv = { dispatch: () => {}, getState: () => ({}) };

    it('passes the raw file (not a FormData) with name + ecosType to api.app.uploadFileV2, and returns {data: {entityRef}}', async () => {
      const file = { name: 'report.pdf', size: 1234 };
      const callback = jest.fn();
      const uploadFileV2Mock = jest.fn(async () => ({ entityRef: 'emodel/temp-file@abc' }));
      const api = { app: { uploadFileV2: uploadFileV2Mock } };

      const result = await runSaga(runEnv, uploadFileV2, { api, file, callback, type: 'emodel/type@doc' }).done;

      expect(uploadFileV2Mock).toHaveBeenCalledTimes(1);
      const [passedFile, passedOpts, passedCallback] = uploadFileV2Mock.mock.calls[0];
      expect(passedFile).toBe(file);
      expect(passedFile instanceof FormData).toBe(false);
      expect(passedOpts).toEqual({ name: 'report.pdf', ecosType: 'emodel/type@doc' });
      expect(passedCallback).toBe(callback);

      expect(result).toEqual({ size: 1234, name: 'report.pdf', data: { entityRef: 'emodel/temp-file@abc' } });
    });

    // The saga passes `ecosType: undefined` when the caller has no type — that is fine and
    // deliberate, but it is NOT what goes on the wire: `chunkedUpload`'s `buildInitBody`
    // normalises it to `''` before `JSON.stringify` can drop the key, because the server's
    // `UploadSessionInitRequest.ecosType` is a non-nullable Kotlin String with no default and a
    // body without it is a 400. The wire body itself is asserted in
    // src/helpers/chunkedUpload/__tests__/chunkedUpload.test.js.
    it('passes ecosType: undefined when no type is given (normalised to "" on the wire by the chunked-upload module)', async () => {
      const file = { name: 'plain.txt', size: 1 };
      const uploadFileV2Mock = jest.fn(async () => ({ entityRef: 'emodel/temp-file@x' }));
      const api = { app: { uploadFileV2: uploadFileV2Mock } };

      await runSaga(runEnv, uploadFileV2, { api, file, callback: undefined }).done;

      const [, passedOpts] = uploadFileV2Mock.mock.calls[0];
      expect(passedOpts).toEqual({ name: 'plain.txt', ecosType: undefined });
    });
  });

  // `rejectedMessages.join('\n')` stringifies whatever `result.reason` is, so a raw rejection
  // value renders as "[object Object]" in this toast. The chunked-upload module guarantees every
  // rejection is a real Error with a readable `.message` (see its "Rejection contract" doc), and
  // this saga reads that `.message` explicitly. Driven here with a realistic
  // chunked-upload-rejected UploadError.
  describe('sagaUploadFiles saga', () => {
    const uploadFilesRunEnv = { dispatch: () => {}, getState: () => ({}) };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('shows a readable message (not "[object Object]") when a file upload is rejected with a chunked-upload-rejected error', async () => {
      const state = {
        documents: {
          [stateId]: {
            dynamicTypes: [{ type: TYPE_A, multiple: true, countDocuments: 0 }]
          }
        }
      };
      // No `reason` here (a bare HTTP-style rejection) — nothing to localise, so the raw
      // `.message` is what the notification shows.
      const uploadError = new UploadError('Upload failed: 500', { status: 500 });
      const api = {
        documents: { getCreateVariants: jest.fn(async () => ({})) },
        app: {
          uploadFileV2: jest.fn(async () => {
            throw uploadError;
          })
        }
      };
      const payload = {
        key: stateId,
        type: TYPE_A,
        record, // not a nodeRef -> goes through the uploadFileV2 (chunked-upload) path
        files: [{ name: 'big.pdf', size: 999 }],
        callback: jest.fn()
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await runSaga({ ...uploadFilesRunEnv, getState: () => state }, sagaUploadFiles, { api }, { payload }).done;

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      const message = NotificationManager.error.mock.calls[0][0];
      expect(message).not.toContain('[object Object]');
      expect(message).toContain('Upload failed: 500');
      consoleErrorSpy.mockRestore();
    });

    // `.message` is English/unlocalised on a chunked-upload-rejected error (see
    // chunkedUpload/index.js's "Rejection contract") — this notification (the Documents widget's
    // own toast, independent of DropZone's inline `clientError`) must show the localised text
    // instead, never the raw "Upload rejected: <reason>" string.
    it('shows the localised chunked-upload message (not the raw English .message) when the rejection carries a known reason', async () => {
      const state = {
        documents: {
          [stateId]: {
            dynamicTypes: [{ type: TYPE_A, multiple: true, countDocuments: 0 }]
          }
        }
      };
      const uploadError = new UploadError('Upload rejected: max-size-exceeded', {
        type: 'chunked-upload-rejected',
        reason: 'max-size-exceeded',
        maxSingleUploadSize: 100,
        maxFileSize: 104857600
      });
      const api = {
        documents: { getCreateVariants: jest.fn(async () => ({})) },
        app: {
          uploadFileV2: jest.fn(async () => {
            throw uploadError;
          })
        }
      };
      const payload = {
        key: stateId,
        type: TYPE_A,
        record, // not a nodeRef -> goes through the uploadFileV2 (chunked-upload) path
        files: [{ name: 'big.pdf', size: 999 }],
        callback: jest.fn()
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await runSaga({ ...uploadFilesRunEnv, getState: () => state }, sagaUploadFiles, { api }, { payload }).done;

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      const message = NotificationManager.error.mock.calls[0][0];
      expect(message).not.toContain('[object Object]');
      expect(message).not.toContain('Upload rejected: max-size-exceeded');
      expect(message.length).toBeGreaterThan(0);
      consoleErrorSpy.mockRestore();
    });

    // Pressing "cancel" is not an error. The chunked-upload module rejects an abort with
    // `UploadError('Upload aborted', {aborted: true})`, which would otherwise pop an English
    // toast at the user on every cancel.
    it('shows NO notification when the upload was cancelled by the user (rejection carries aborted: true)', async () => {
      const state = {
        documents: {
          [stateId]: {
            dynamicTypes: [{ type: TYPE_A, multiple: true, countDocuments: 0 }]
          }
        }
      };
      const uploadError = new UploadError('Upload aborted', { aborted: true });
      const api = {
        documents: { getCreateVariants: jest.fn(async () => ({})) },
        app: {
          uploadFileV2: jest.fn(async () => {
            throw uploadError;
          })
        }
      };
      const payload = {
        key: stateId,
        type: TYPE_A,
        record, // not a nodeRef -> goes through the uploadFileV2 (chunked-upload) path
        files: [{ name: 'big.pdf', size: 999 }],
        callback: jest.fn()
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await runSaga({ ...uploadFilesRunEnv, getState: () => state }, sagaUploadFiles, { api }, { payload }).done;

      expect(NotificationManager.error).not.toHaveBeenCalled();
      // ...and the cancelled upload must still not open the form manager, exactly like the old
      // empty-message rejection did not.
      expect(NotificationManager.success).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
