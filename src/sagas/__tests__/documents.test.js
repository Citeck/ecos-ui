import { runSaga } from 'redux-saga';

import { setDocumentsByTypes } from '../../actions/documents';
import documentsReducer from '../../reducers/documents';
import { sagaGetDynamicTypes } from '../documents';

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
        [{ recordRef: 'doc@2', __id: 'doc@2' }, { recordRef: 'doc@3', __id: 'doc@3' }]
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
});
