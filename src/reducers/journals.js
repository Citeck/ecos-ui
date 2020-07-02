import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  initState,
  setColumnsSetup,
  setDashletConfig,
  setEditorMode,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournals,
  setJournalSetting,
  setJournalSettings,
  setJournalsItem,
  setJournalsList,
  setJournalsListItem,
  setOnlyLinked,
  setCustomJournalMode,
  setCustomJournal,
  setPerformGroupActionResponse,
  setPerformGroupActionLoader,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setRecordRef,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords,
  setSettingItem,
  setUrl,
  setZipNodeRef
} from '../actions/journals';
import { setLoading } from '../actions/loader';
import { deepClone, t } from '../helpers/util';
import { handleAction, handleState } from '../helpers/redux';
import {
  DEFAULT_INLINE_TOOL_SETTINGS,
  DEFAULT_PAGINATION,
  JOURNAL_SETTING_DATA_FIELD,
  JOURNAL_SETTING_ID_FIELD
} from '../components/Journals/constants';

const defaultState = {
  loading: true,
  editorMode: false,

  url: {},

  grid: {
    data: [],
    columns: [],
    total: 0,
    createVariants: [],
    predicate: {},
    groupBy: null,
    sortBy: [],
    pagination: DEFAULT_PAGINATION,
    minHeight: null,
    editingRules: {}
  },

  journalsList: [],
  journals: [],
  journalSettings: [],

  config: null,
  initConfig: null,
  journalConfig: {
    meta: { createVariants: [] }
  },
  recordRef: null,

  predicate: null,
  columnsSetup: {
    columns: [],
    sortBy: []
  },
  grouping: {
    columns: [],
    groupBy: []
  },

  journalSetting: {
    title: '',
    sortBy: [],
    groupBy: [],
    columns: [],
    predicate: null,
    permissions: {
      Write: true,
      Delete: true
    }
  },

  selectedRecords: [],
  selectAllRecords: false,
  selectAllRecordsVisible: false,

  inlineToolSettings: DEFAULT_INLINE_TOOL_SETTINGS,

  previewUrl: '',
  previewFileName: '',
  zipNodeRef: null,

  isLoadingPerformGroupActions: false,
  performGroupActionResponse: []
};

const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [initState]: (state, action) => {
      const id = action.payload;

      if (state[id]) {
        return { ...state };
      }

      return {
        ...state,
        [id]: deepClone(defaultState)
      };
    },
    [setUrl]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              url: {
                ...action.payload
              }
            }
          }
        : {
            ...state,
            url: {
              ...action.payload
            }
          };
    },
    [setPredicate]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { predicate: action.payload });
    },
    [setZipNodeRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { zipNodeRef: action.payload });
    },
    [setPerformGroupActionResponse]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { performGroupActionResponse: action.payload });
    },
    [setPerformGroupActionResponse]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { performGroupActionResponse: action.payload });
    },
    [setPerformGroupActionLoader]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { isLoadingPerformGroupActions: action.payload });
    },
    [setPreviewUrl]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { previewUrl: action.payload });
    },
    [setPreviewFileName]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { previewFileName: action.payload });
    },
    [setColumnsSetup]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { columnsSetup: action.payload });
    },
    [setGrouping]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { grouping: action.payload });
    },
    [setJournalSettings]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        journalSettings: [
          {
            [JOURNAL_SETTING_ID_FIELD]: '',
            [JOURNAL_SETTING_DATA_FIELD]: { title: t('journals.default') },
            notRemovable: true
          },
          ...Array.from(action.payload)
        ]
      });
    },
    [setJournalSetting]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              journalSetting: {
                ...state[stateId].journalSetting,
                ...action.payload
              }
            }
          }
        : {
            ...state,
            journalSetting: {
              ...state.journalSetting,
              ...action.payload
            }
          };
    },
    [setGridInlineToolSettings]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        inlineToolSettings: action.payload,
        previewFileName: get(action.payload, ['row', 'cm:title'], '')
      });
    },
    [setJournalsListItem]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              config: {
                ...state[stateId].config,
                journalsListId: action.payload.id
              }
            }
          }
        : {
            ...state,
            config: {
              ...state.config,
              journalsListId: action.payload.id
            }
          };
    },
    [setJournalsItem]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              config: {
                ...state[stateId].config,
                journalId: action.payload.nodeRef,
                journalType: action.payload.type
              }
            }
          }
        : {
            ...state,
            config: {
              ...state.config,
              journalId: action.payload.nodeRef,
              journalType: action.payload.type
            }
          };
    },
    [setSettingItem]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              config: {
                ...state[stateId].config,
                journalSettingId: action.payload
              }
            }
          }
        : {
            ...state,
            config: {
              ...state.config,
              journalSettingId: action.payload
            }
          };
    },
    [setCustomJournal]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              config: {
                ...state[stateId].config,
                customJournal: action.payload
              }
            }
          }
        : {
            ...state,
            config: {
              ...state.config,
              customJournal: action.payload
            }
          };
    },
    [setOnlyLinked]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              config: {
                ...state[stateId].config,
                onlyLinked: action.payload
              }
            }
          }
        : {
            ...state,
            config: {
              ...state.config,
              onlyLinked: action.payload
            }
          };
    },
    [setCustomJournalMode]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              config: {
                ...state[stateId].config,
                customJournalMode: action.payload
              }
            }
          }
        : {
            ...state,
            config: {
              ...state.config,
              customJournalMode: action.payload
            }
          };
    },
    [setEditorMode]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { editorMode: action.payload });
    },
    [setJournalsList]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { journalsList: action.payload });
    },
    [setJournals]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { journals: action.payload });
    },
    [setGrid]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...state[stateId],
              grid: {
                ...state[stateId].grid,
                ...action.payload
              }
            }
          }
        : {
            ...state,
            grid: {
              ...state.grid,
              ...action.payload
            }
          };
    },
    [setDashletConfig]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { initConfig: action.payload, config: action.payload });
    },
    [setJournalConfig]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { journalConfig: action.payload });
    },
    [setSelectedRecords]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectedRecords: action.payload });
    },
    [setSelectAllRecords]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectAllRecords: action.payload });
    },
    [setSelectAllRecordsVisible]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectAllRecordsVisible: action.payload });
    },
    [setLoading]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { loading: action.payload });
    },
    [setRecordRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { recordRef: action.payload });
    }
  },
  initialState
);
