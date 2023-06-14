import { createSelector } from 'reselect';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { initialState } from '../reducers/kanban';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

const prefix = 'kanban';

export const selectKanban = (state, key) => get(state, [prefix, key]) || { ...initialState };

export const selectBoardList = createSelector(selectKanban, state => get(state, 'boardList') || []);

export const selectBoardConfig = createSelector(selectKanban, state => get(state, 'boardConfig') || {});

export const selectFormProps = createSelector(selectKanban, state => get(state, 'formProps') || {});

export const selectIsKanbanEnabled = createSelector(selectKanban, state => get(state, 'isEnabled') || false);

export const selectPagination = createSelector(selectKanban, state => cloneDeep(get(state, 'pagination', DEFAULT_PAGINATION)));

export const selectKanbanPageProps = createSelector(selectKanban, data => ({
  originKanbanSettings: data.originKanbanSettings,
  kanbanSettings: data.kanbanSettings,
  boardList: data.boardList,
  templateList: data.templateList,
  boardConfig: data.boardConfig,
  isLoading: data.isLoading,
  isEnabled: data.isEnabled,
  totalCount: data.totalCount
}));

export const selectKanbanProps = createSelector(selectKanban, data => ({
  originKanbanSettings: data.originKanbanSettings,
  kanbanSettings: data.kanbanSettings,
  columns: get(data, 'boardConfig.columns'),
  formProps: data.formProps,
  dataCards: data.dataCards || [],
  resolvedActions: data.resolvedActions,
  totalCount: data.totalCount,
  isLoading: data.isLoading,
  isFirstLoading: data.isFirstLoading,
  page: data.pagination.page,
  selectedBoard: get(data, 'boardConfig.name')
}));

export const selectColumnData = (state, key, index) => get(state, [prefix, key, 'dataCards', index]) || {};
export const selectCardActions = (state, key, index) => get(state, [prefix, key, 'resolvedActions', index]) || {};
export const selectIsLoadingCol = (state, key, index) => get(state, [prefix, key, 'isLoadingColumns'], []).includes(index) || false;
export const selectColumnInfo = (state, key, index) => get(state, [prefix, key, 'boardConfig', 'columns', index], []) || {};

export const selectColumnProps = createSelector(
  [selectKanban, selectColumnData, selectColumnInfo, selectCardActions, selectIsLoadingCol],
  (kanban, columnData, columnInfo, actions, isLoadingCol) => ({
    readOnly: get(kanban, 'boardConfig.readOnly'),
    records: columnData.records,
    error: columnData.error,
    actions,
    columnInfo,
    isLoadingCol,
    formProps: kanban.formProps,
    isLoading: kanban.isLoading,
    isFirstLoading: kanban.isFirstLoading,
    isFiltered: kanban.isFiltered
  })
);
