import { handleActions } from 'redux-actions';
import {
  setEditorMode,
  setJournalsList,
  setJournals,
  setGrid,
  setDashletConfig,
  setJournalsListItem,
  setJournalsItem,
  setSettingItem,
  setJournalConfig,
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setGridInlineToolSettings,
  setJournalSetting,
  setJournalSettings,
  setPredicate,
  setColumnsSetup,
  setGrouping,
  setPreviewUrl,
  setUrl,
  initState,
  setPerformGroupActionResponse
} from '../actions/journals';
import { setLoading } from '../actions/loader';
import { t, deepClone } from '../helpers/util';
import { handleAction, handleState } from '../helpers/redux';
import { JOURNAL_SETTING_ID_FIELD, JOURNAL_SETTING_DATA_FIELD } from '../components/Journals/constants';

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
    pagination: {
      skipCount: 0,
      maxItems: 10,
      page: 1
    },
    minHeight: null
  },

  journalsList: [],
  journals: [],
  journalSettings: [],

  config: null,
  initConfig: null,
  journalConfig: {
    meta: {},
    createVariants: []
  },

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

  inlineToolSettings: {
    height: 0,
    top: 0,
    left: 0,
    row: {}
  },

  previewUrl: '',

  performGroupActionResponse: []
};

const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [initState]: (state, action) => {
      return {
        ...state,
        [action.payload]: deepClone(defaultState)
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
                ...state[stateId].url,
                ...action.payload
              }
            }
          }
        : {
            ...state,
            url: {
              ...state.url,
              ...action.payload
            }
          };
    },
    [setPredicate]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { predicate: action.payload });
    },
    [setPerformGroupActionResponse]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { performGroupActionResponse: action.payload });
    },
    [setPreviewUrl]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { previewUrl: action.payload });
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

      return handleState(state, stateId, { inlineToolSettings: action.payload });
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
    }
  },
  initialState
);
