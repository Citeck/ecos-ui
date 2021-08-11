import { handleActions } from 'redux-actions';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import {
  initState,
  selectJournal,
  runSearch,
  setCheckLoading,
  setColumnsSetup,
  setCustomJournal,
  setCustomJournalMode,
  setDashletConfig,
  setEditorMode,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournalExistStatus,
  setJournalSetting,
  setJournalSettings,
  setJournalsItem,
  setLoading,
  setOnlyLinked,
  setOriginGridSettings,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setRecordRef,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedJournals,
  setSelectedRecords,
  setSettingItem,
  setUrl,
  toggleViewMode
} from '../actions/journals';
import { t } from '../helpers/util';
import { handleAction, handleState, updateState } from '../helpers/redux';
import {
  DEFAULT_INLINE_TOOL_SETTINGS,
  DEFAULT_PAGINATION,
  JOURNAL_DASHLET_CONFIG_VERSION,
  JOURNAL_SETTING_DATA_FIELD,
  JOURNAL_SETTING_ID_FIELD
} from '../components/Journals/constants';

export const emptyJournalConfig = Object.freeze({
  meta: { createVariants: [] }
});

export const defaultState = {
  loading: true,
  editorMode: false,
  viewMode: undefined,

  url: {},

  grid: {
    data: [],
    columns: [],
    total: 0,
    createVariants: [],
    predicate: {},
    groupBy: [],
    sortBy: [],
    pagination: DEFAULT_PAGINATION,
    minHeight: null,
    editingRules: {},
    search: ''
  },

  journalsList: [],
  journals: [],
  journalSettings: [],

  config: null,
  initConfig: null,
  journalConfig: emptyJournalConfig,
  recordRef: null,
  isExistJournal: true,

  predicate: null,

  originGridSettings: {
    predicate: null,
    columnsSetup: {
      columns: [],
      sortBy: []
    },
    grouping: {
      columns: [],
      groupBy: []
    }
  },

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
      Write: true
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
  performGroupActionResponse: [],
  selectedJournals: []
};

const initialState = {};
const updateConfig = (config, data = {}) => ({
  ...config,
  [JOURNAL_DASHLET_CONFIG_VERSION]: {
    ...get(config, [JOURNAL_DASHLET_CONFIG_VERSION], {}),
    ...data
  }
});

Object.freeze(initialState);
Object.freeze(defaultState);

export default handleActions(
  {
    [initState]: (state, action) => {
      const stateId = action.payload.stateId;

      return {
        ...state,
        [stateId]: { ...cloneDeep(defaultState), ...(state[stateId] || {}) }
      };
    },
    [toggleViewMode]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return updateState(state, stateId, { viewMode: action.payload.viewMode }, defaultState);
    },
    [setUrl]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
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
    [setOriginGridSettings]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { originGridSettings: action.payload });
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
              ...(state[stateId] || {}),
              journalSetting: {
                ...(state[stateId] || {}).journalSetting,
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
    [setJournalsItem]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig((state[stateId] || {}).config, {
                journalId: action.payload.nodeRef,
                journalType: action.payload.type
              })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, {
              journalId: action.payload.nodeRef,
              journalType: action.payload.type
            })
          };
    },
    [setSettingItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const config = get(state, [stateId, 'config'], {});

      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig(config, { journalSettingId: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { journalSettingId: action.payload })
          };
    },
    [setCustomJournal]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig((state[stateId] || {}).config, { customJournal: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { customJournal: action.payload })
          };
    },
    [setOnlyLinked]: (state, action) => {
      const stateId = action.payload.stateId;
      const config = get(state, [stateId, 'config'], {});

      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig(config, { onlyLinked: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { onlyLinked: action.payload })
          };
    },
    [setCustomJournalMode]: (state, action) => {
      const stateId = action.payload.stateId;
      const config = get(state, [stateId, 'config'], {});

      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig(config, { customJournalMode: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { customJournalMode: action.payload })
          };
    },
    [setEditorMode]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { editorMode: action.payload });
    },
    [setGrid]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              grid: {
                ...(state[stateId] || {}).grid,
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

      const initConfig = get(state, [stateId, 'initConfig']);
      const config = action.payload;
      const data = { config, initConfig: config };

      if (!!initConfig && !isEqual(initConfig, config)) {
        data.loading = true;
      }

      return handleState(state, stateId, data);
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
    },
    [runSearch]: (state, action) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, {
        grid: {
          ...(state[stateId] || {}).grid,
          search: action.payload.text,
          pagination: {
            ...(state[stateId] || {}).grid.pagination,
            skipCount: 0,
            page: 1
          }
        }
      });
    },
    [selectJournal]: (state, action) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, {
        grid: {
          ...(state[stateId] || {}).grid,
          pagination: { ...DEFAULT_PAGINATION }
        }
      });
    },
    [setSelectedJournals]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        selectedJournals: handledAction.payload
      });
    },
    [setJournalExistStatus]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        isExistJournal: Boolean(handledAction.payload)
      });
    },
    [setCheckLoading]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        isCheckLoading: Boolean(handledAction.payload)
      });
    }
  },
  initialState
);
