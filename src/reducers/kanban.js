import { handleActions } from 'redux-actions';

import {
  applyFilter,
  getBoardConfig,
  getBoardData,
  reloadBoardData,
  resetFilter,
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setIsFiltered,
  setKanbanSettings,
  setLoading,
  setLoadingColumns,
  setPagination,
  setResolvedActions,
  setOriginKanbanSettings,
  setTotalCount,
  applyPreset,
  clearFiltered,
  setSwimlaneGrouping,
  setSwimlaneValues,
  setSwimlaneCellData,
  toggleSwimlaneCollapse,
  setSwimlaneCellLoading
} from '../actions/kanban';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';
import { t } from '../helpers/export/util';
import { updateState } from '../helpers/redux';

export const initialState = {
  isLoading: true,
  isLoadingColumns: [],
  kanbanSettings: {},
  originKanbanSettings: {},
  isFirstLoading: true,
  isFiltered: false,
  boardConfig: undefined,
  boardList: undefined,
  boardTemplates: [],
  formProps: null,
  totalCount: 0,
  dataCards: [],
  resolvedActions: [],
  pagination: DEFAULT_PAGINATION,
  swimlaneGrouping: null,
  swimlanes: []
};

export default handleActions(
  {
    [getBoardConfig]: (state, { payload }) => {
      return updateState(state, payload.stateId, { boardConfig: undefined }, initialState);
    },
    [getBoardData]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isFirstLoading: true, isLoading: true }, initialState);
    },
    [applyFilter]: (state, { payload }) => {
      const { stateId = '', settings = {} } = payload;

      const isFiltered =
        !state[stateId] ||
        (state[stateId] && !state[stateId].templateList) ||
        state[stateId]?.templateList?.length === 0 ||
        (state[stateId]?.templateList?.length > 0 && settings.journalSetting?.id === '');

      return updateState(state, stateId, { dataCards: [], isLoading: true, isFiltered }, initialState);
    },
    [clearFiltered]: (state, { payload }) => {
      return updateState(state, payload.stateId, { isFiltered: false }, initialState);
    },
    [applyPreset]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isFirstLoading: true, isLoading: true }, initialState);
    },
    [resetFilter]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isLoading: true }, initialState);
    },
    [reloadBoardData]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isFirstLoading: true }, initialState);
    },
    [setBoardConfig]: (state, { payload }) => {
      const { stateId, boardConfig } = payload;
      return updateState(state, stateId, { boardConfig }, initialState);
    },
    [setKanbanSettings]: (state, { payload }) => {
      const { stateId, kanbanSettings, hasWritePermission } = payload;
      return updateState(state, stateId, { kanbanSettings, hasWritePermission }, initialState);
    },
    [setOriginKanbanSettings]: (state, { payload }) => {
      const { stateId, originKanbanSettings } = payload;
      return updateState(state, stateId, { originKanbanSettings }, initialState);
    },
    [setLoading]: (state, { payload }) => {
      const { stateId, isLoading } = payload;
      return updateState(state, stateId, { isLoading }, initialState);
    },
    [setIsFiltered]: (state, { payload }) => {
      const { stateId, isFiltered } = payload;
      return updateState(state, stateId, { isFiltered }, initialState);
    },
    [setFormProps]: (state, { payload }) => {
      const { stateId, formProps } = payload;
      return updateState(state, stateId, { formProps }, initialState);
    },
    [setBoardList]: (state, { payload }) => {
      const { stateId, boardList, templateList } = payload;
      const journalSettings = [{ id: '', name: t('journal.presets.default'), settings: {} }];
      Array.isArray(templateList) && journalSettings.push(...templateList);

      return updateState(state, stateId, { boardList, templateList: journalSettings }, initialState);
    },
    [setIsEnabled]: (state, { payload }) => {
      const { stateId, isEnabled } = payload;
      return updateState(state, stateId, { isEnabled }, initialState);
    },
    [setDataCards]: (state, { payload }) => {
      const { stateId, dataCards } = payload;
      return updateState(state, stateId, { dataCards, isFirstLoading: false }, initialState);
    },
    [setTotalCount]: (state, { payload }) => {
      const { stateId, totalCount } = payload;
      return updateState(state, stateId, { totalCount }, initialState);
    },
    [setPagination]: (state, { payload }) => {
      const { stateId, pagination } = payload;
      return updateState(state, stateId, { pagination }, initialState);
    },
    [setResolvedActions]: (state, { payload }) => {
      const { stateId, resolvedActions } = payload;
      return updateState(state, stateId, { resolvedActions }, initialState);
    },
    [setLoadingColumns]: (state, { payload }) => {
      const { stateId, isLoadingColumns } = payload;
      return updateState(state, stateId, { isLoadingColumns }, initialState);
    },
    [setSwimlaneGrouping]: (state, { payload }) => {
      const { stateId, swimlaneGrouping } = payload;
      return updateState(state, stateId, { swimlaneGrouping, swimlanes: [], isLoading: true }, initialState);
    },
    [setSwimlaneValues]: (state, { payload }) => {
      const { stateId, swimlanes } = payload;
      return updateState(state, stateId, { swimlanes, isFirstLoading: false }, initialState);
    },
    [setSwimlaneCellData]: (state, { payload }) => {
      const { stateId, swimlaneId, statusId, records, totalCount, error } = payload;
      const prevSwimlanes = (state[stateId] || {}).swimlanes || [];
      const swimlanes = prevSwimlanes.map(sl => {
        if (sl.id !== swimlaneId) {
          return sl;
        }
        return {
          ...sl,
          cells: {
            ...sl.cells,
            [statusId]: {
              ...sl.cells[statusId],
              records: records,
              totalCount: totalCount,
              error: error,
              isLoading: false
            }
          }
        };
      });
      return updateState(state, stateId, { swimlanes }, initialState);
    },
    [toggleSwimlaneCollapse]: (state, { payload }) => {
      const { stateId, swimlaneId } = payload;
      const prevSwimlanes = (state[stateId] || {}).swimlanes || [];
      const swimlanes = prevSwimlanes.map(sl => {
        if (sl.id !== swimlaneId) {
          return sl;
        }
        return { ...sl, isCollapsed: !sl.isCollapsed };
      });
      return updateState(state, stateId, { swimlanes }, initialState);
    },
    [setSwimlaneCellLoading]: (state, { payload }) => {
      const { stateId, swimlaneId, statusId, isLoading } = payload;
      const prevSwimlanes = (state[stateId] || {}).swimlanes || [];
      const swimlanes = prevSwimlanes.map(sl => {
        if (sl.id !== swimlaneId) {
          return sl;
        }
        return {
          ...sl,
          cells: {
            ...sl.cells,
            [statusId]: {
              ...sl.cells[statusId],
              isLoading
            }
          }
        };
      });
      return updateState(state, stateId, { swimlanes }, initialState);
    }
  },
  {}
);
