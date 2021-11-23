import { handleActions } from 'redux-actions';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import {
  deselectAllRecords,
  initState,
  resetState,
  runSearch,
  selectJournal,
  setCheckLoading,
  setColumnsSetup,
  setDashletConfig,
  setEditorMode,
  setExcludedRecords,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournalExistStatus,
  setJournalSetting,
  setJournalSettings,
  setLoading,
  setOriginGridSettings,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setRecordRef,
  setSelectAllPageRecords,
  setSelectAllRecordsVisible,
  setSelectedJournals,
  setSelectedRecords,
  setUrl,
  toggleViewMode
} from '../actions/journals';
import { t } from '../helpers/export/util';
import { getCurrentStateById, handleAction, handleState, updateState } from '../helpers/redux';
import { DEFAULT_INLINE_TOOL_SETTINGS, DEFAULT_PAGINATION, relatedViews } from '../components/Journals/constants';

export const emptyJournalConfig = Object.freeze({
  meta: { createVariants: [] }
});

export const defaultState = {
  loading: true,
  editorMode: false,
  viewMode: undefined,
  wasChangedSettingsOn: [],

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
    sortBy: [],
    groupBy: [],
    columns: [],
    predicate: null,
    permissions: {
      Write: true
    }
  },

  selectedRecords: [],
  excludedRecords: [],
  selectAllPageRecords: false,
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
    [resetState]: (state, action) => {
      const id = action.payload;

      return {
        ...state,
        [id]: { ...cloneDeep(defaultState) }
      };
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
      const journalSettings = [{ id: '', displayName: t('journal.presets.default') }];
      Array.isArray(action.payload) && journalSettings.push(...action.payload);
      return handleState(state, stateId, { journalSettings });
    },
    [setJournalSetting]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);
      const curState = getCurrentStateById(state, stateId, defaultState);

      const wasChangedSettingsOn = [];

      if (!isEqual(curState.journalSetting, defaultState.journalSetting) && !isEmpty(curState.journalSetting)) {
        wasChangedSettingsOn.push(...relatedViews.filter(item => item !== curState.viewMode));
      }

      const newJournalSetting = { ...curState.journalSetting, ...action.payload };

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...curState,
              wasChangedSettingsOn,
              journalSetting: newJournalSetting
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
    [setExcludedRecords]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { excludedRecords: action.payload });
    },
    [setSelectAllPageRecords]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectAllPageRecords: action.payload });
    },
    [setSelectAllRecordsVisible]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectAllRecordsVisible: action.payload });
    },
    [deselectAllRecords]: (state, action) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, {
        selectAllRecordsVisible: false,
        selectAllPageRecords: false,
        selectedRecords: [],
        excludedRecords: []
      });
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
