import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import { handleActions } from 'redux-actions';

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
  setJournalExpandableProp,
  setLoadingGrid,
  setLoading,
  setForceUpdate,
  setOriginGridSettings,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setRecordRef,
  setSelectAllPageRecords,
  setSelectAllRecordsVisible,
  setSelectedJournals,
  setSelectedRecords,
  setFooterValue,
  toggleViewMode,
  setUrl,
  openSelectedJournal,
  setSearchText,
  saveColumn,
  setSearching,
  setJournalWidgetsConfig,
  setBreadcrumbs
} from '../actions/journals';
import { DEFAULT_INLINE_TOOL_SETTINGS, DEFAULT_PAGINATION, relatedViews } from '../components/Journals/constants';
import { t } from '../helpers/export/util';
import { getCurrentStateById, handleAction, handleState, updateState } from '../helpers/redux';

export const initialStateGrouping = {
  needCount: false,
  columns: [],
  groupBy: []
};

export const emptyJournalConfig = Object.freeze({
  meta: { createVariants: [] }
});

export const defaultState = {
  loading: true,
  loadingGrid: true,
  searching: false,
  editorMode: false,
  viewMode: undefined,
  wasChangedSettingsOn: [],

  url: {},

  widgetsConfig: {
    widgets: null
  },

  grid: {
    data: [],
    columns: [],
    isExpandedFromGrouped: false,
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
  breadcrumbs: [],

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
      isExpandedFromGrouped: false,
      sortBy: []
    },
    grouping: initialStateGrouping
  },

  columnsSetup: {
    columns: [],
    isExpandedFromGrouped: false,
    sortBy: []
  },
  grouping: initialStateGrouping,

  journalSetting: {
    sortBy: [],
    groupBy: [],
    columns: [],
    needCount: false,
    grouping: initialStateGrouping,
    isExpandedFromGrouped: false,
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

      return handleState(state, stateId, {
        originGridSettings: {
          ...action.payload,
          isExpandedFromGrouped: false
        }
      });
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
    [setBreadcrumbs]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);
      return handleState(state, stateId, { breadcrumbs: action.payload });
    },
    [setJournalExpandableProp]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        grid: {
          ...(state[stateId] || {}).grid,
          isExpandedFromGrouped: !!action.payload
        }
      });
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
    [setSearching]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { searching: action.payload });
    },
    [setLoadingGrid]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { loadingGrid: action.payload });
    },
    [setForceUpdate]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { forceUpdate: action.payload });
    },
    [setRecordRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { recordRef: action.payload });
    },
    [setJournalWidgetsConfig]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        widgetsConfig: {
          ...state[stateId].widgetsConfig,
          ...action.payload
        }
      });
    },
    [openSelectedJournal]: (state, action) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, { selectAllPageRecords: false });
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
    },
    [setSearchText]: (state, action) => {
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
    [saveColumn]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      const journalSetting = get(state, [stateId, 'journalSetting']);
      const cloneJournalSetting = cloneDeep(journalSetting);

      const updatedColumn = cloneJournalSetting.columns.find(x => x.name === action.payload.name);
      updatedColumn.width = action.payload.width;

      const grid = get(state, [stateId, 'grid']);
      const cloneGrid = cloneDeep(grid);

      const updatedColumnGrid = cloneGrid.columns.find(x => x.name === action.payload.name);
      updatedColumnGrid.width = action.payload.width;

      return updateState(state, stateId, { grid: cloneGrid, journalSetting: cloneJournalSetting }, defaultState);
    },
    [setFooterValue]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        footerValue: handledAction.payload
      });
    }
  },
  initialState
);
