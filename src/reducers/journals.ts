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
  setRecordRef,
  setSelectAllPageRecords,
  setSelectAllRecordsVisible,
  setSelectedJournals,
  setSelectedRecords,
  setFooterValue,
  toggleViewMode,
  setUrl,
  setSearchText,
  saveColumn,
  setSearching,
  setJournalWidgetsConfig,
  setBreadcrumbs
} from '@/actions/journals';
import { DEFAULT_PAGINATION, relatedViews } from '@/components/Journals/constants';
import { getCurrentStateById, handleState, updateState } from '@/helpers/redux';
import { handleAction } from '@/helpers/store';
import { t } from '@/helpers/util';
import { IJournalState } from '@/types/store/journals';

export const initialStateGrouping = {
  needCount: false,
  columns: [],
  groupBy: []
};

export const emptyJournalConfig = Object.freeze({
  meta: { createVariants: [] }
});

export const defaultState: IJournalState = {
  loading: true,
  loadingGrid: true,
  searching: false,
  editorMode: false,
  viewMode: undefined,
  wasChangedSettingsOn: [],

  url: {},
  footerValue: null,

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

  selectedJournals: []
};

type InitialStateJournals = Record<string, IJournalState>;
const initialState: InitialStateJournals = {};

Object.freeze(initialState);
Object.freeze(defaultState);

export default handleActions<InitialStateJournals, any>(
  {
    [initState.toString()]: (state, action: ReturnType<typeof initState>) => {
      const stateId = action.payload.stateId;

      return {
        ...state,
        [stateId]: { ...cloneDeep(defaultState), ...(state[stateId] || {}) }
      };
    },
    [toggleViewMode.toString()]: (state, action: ReturnType<typeof toggleViewMode>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return updateState(state, stateId, { viewMode: handledAction.payload.viewMode }, defaultState);
    },
    [resetState.toString()]: (state, action: ReturnType<typeof resetState>) => {
      const id = action.payload;

      return {
        ...state,
        [id]: { ...cloneDeep(defaultState) }
      };
    },
    [setUrl.toString()]: (state, action: ReturnType<typeof setUrl>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...(state[stateId] || {}),
          url: {
            ...handledAction.payload
          }
        }
      };
    },
    [setPredicate.toString()]: (state, action: ReturnType<typeof setPredicate>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { predicate: handledAction.payload });
    },
    [setOriginGridSettings.toString()]: (state, action: ReturnType<typeof setOriginGridSettings>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        originGridSettings: {
          ...handledAction.payload,
          isExpandedFromGrouped: false
        }
      });
    },
    [setColumnsSetup.toString()]: (state, action: ReturnType<typeof setColumnsSetup>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { columnsSetup: handledAction.payload });
    },
    [setGrouping.toString()]: (state, action: ReturnType<typeof setGrouping>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { grouping: handledAction.payload });
    },
    [setJournalSettings.toString()]: (state, action: ReturnType<typeof setJournalSettings>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);
      const journalSettings = [{ id: '', displayName: t('journal.presets.default') }];
      Array.isArray(handledAction.payload) && journalSettings.push(...handledAction.payload);
      return handleState(state, stateId, { journalSettings });
    },
    [setBreadcrumbs.toString()]: (state, action: ReturnType<typeof setBreadcrumbs>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);
      return handleState(state, stateId, { breadcrumbs: handledAction.payload });
    },
    [setJournalExpandableProp.toString()]: (state, action: ReturnType<typeof setJournalExpandableProp>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        grid: {
          ...(state[stateId] || {}).grid,
          isExpandedFromGrouped: !!handledAction.payload
        }
      });
    },
    [setJournalSetting.toString()]: (state, action: ReturnType<typeof setJournalSetting>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);
      const curState = getCurrentStateById(state, stateId, defaultState);

      const wasChangedSettingsOn = [];

      if (!isEqual(curState.journalSetting, defaultState.journalSetting) && !isEmpty(curState.journalSetting)) {
        wasChangedSettingsOn.push(...relatedViews.filter(item => item !== curState.viewMode));
      }

      const newJournalSetting = { ...curState.journalSetting, ...handledAction.payload };

      return {
        ...state,
        [stateId]: {
          ...curState,
          wasChangedSettingsOn,
          journalSetting: newJournalSetting
        }
      };
    },
    [setEditorMode.toString()]: (state, action: ReturnType<typeof setEditorMode>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { editorMode: handledAction.payload });
    },
    [setGrid.toString()]: (state, action: ReturnType<typeof setGrid>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...(state[stateId] || {}),
          grid: {
            ...(state[stateId] || {}).grid,
            ...handledAction.payload
          }
        }
      };
    },
    [setDashletConfig.toString()]: (state, action: ReturnType<typeof setDashletConfig>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      const initConfig = get(state, [stateId, 'initConfig']);
      const config = handledAction.payload;
      const baseData = { config, initConfig: config };
      let data;

      if (!!initConfig && !isEqual(initConfig, config)) {
        data = {
          ...baseData,
          loading: true
        };
      } else {
        data = baseData;
      }

      return handleState(state, stateId, data);
    },
    [setJournalConfig.toString()]: (state, action: ReturnType<typeof setJournalConfig>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { journalConfig: handledAction.payload });
    },
    [setSelectedRecords.toString()]: (state, action: ReturnType<typeof setSelectedRecords>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { selectedRecords: handledAction.payload });
    },
    [setExcludedRecords.toString()]: (state, action: ReturnType<typeof setExcludedRecords>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { excludedRecords: handledAction.payload });
    },
    [setSelectAllPageRecords.toString()]: (state, action: ReturnType<typeof setSelectAllPageRecords>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { selectAllPageRecords: handledAction.payload });
    },
    [setSelectAllRecordsVisible.toString()]: (state, action: ReturnType<typeof setSelectAllRecordsVisible>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { selectAllRecordsVisible: handledAction.payload });
    },
    [deselectAllRecords.toString()]: (state, action: ReturnType<typeof deselectAllRecords>) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, {
        selectAllRecordsVisible: false,
        selectAllPageRecords: false,
        selectedRecords: [],
        excludedRecords: []
      });
    },
    [setLoading.toString()]: (state, action: ReturnType<typeof setLoading>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { loading: handledAction.payload });
    },
    [setSearching.toString()]: (state, action: ReturnType<typeof setSearching>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { searching: handledAction.payload });
    },
    [setLoadingGrid.toString()]: (state, action: ReturnType<typeof setLoadingGrid>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { loadingGrid: handledAction.payload });
    },
    [setForceUpdate.toString()]: (state, action: ReturnType<typeof setForceUpdate>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { forceUpdate: handledAction.payload });
    },
    [setRecordRef.toString()]: (state, action: ReturnType<typeof setRecordRef>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, { recordRef: handledAction.payload });
    },
    [setJournalWidgetsConfig.toString()]: (state, action: ReturnType<typeof setJournalWidgetsConfig>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        widgetsConfig: {
          ...state[stateId].widgetsConfig,
          ...handledAction.payload
        }
      });
    },
    [runSearch.toString()]: (state, action: ReturnType<typeof runSearch>) => {
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
    [selectJournal.toString()]: (state, action: ReturnType<typeof selectJournal>) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, {
        grid: {
          ...(state[stateId] || {}).grid,
          pagination: { ...DEFAULT_PAGINATION }
        }
      });
    },
    [setSelectedJournals.toString()]: (state, action: ReturnType<typeof setSelectedJournals>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        selectedJournals: handledAction.payload
      });
    },
    [setJournalExistStatus.toString()]: (state, action: ReturnType<typeof setJournalExistStatus>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        isExistJournal: Boolean(handledAction.payload)
      });
    },
    [setCheckLoading.toString()]: (state, action: ReturnType<typeof setCheckLoading>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        isCheckLoading: Boolean(handledAction.payload)
      });
    },
    [setSearchText.toString()]: (state, action: ReturnType<typeof setSearchText>) => {
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
    [saveColumn.toString()]: (state, action: ReturnType<typeof saveColumn>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      const journalSetting = get(state, [stateId, 'journalSetting']);
      const cloneJournalSetting = cloneDeep(journalSetting);

      const updatedColumn = cloneJournalSetting.columns?.find(x => x.name === handledAction.payload.name);
      if (updatedColumn) {
        updatedColumn.width = handledAction.payload.width;
      }

      const grid = get(state, [stateId, 'grid']);
      const cloneGrid = cloneDeep(grid);

      const updatedColumnGrid = cloneGrid.columns.find(x => x.name === handledAction.payload.name);
      if (updatedColumnGrid) {
        updatedColumnGrid.width = handledAction.payload.width;
      }

      return updateState(state, stateId, { grid: cloneGrid, journalSetting: cloneJournalSetting }, defaultState);
    },
    [setFooterValue.toString()]: (state, action: ReturnType<typeof setFooterValue>) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        footerValue: handledAction.payload
      });
    }
  },
  initialState
);
