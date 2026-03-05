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

export const selectSwimlaneGrouping = createSelector(selectKanban, s => s.swimlaneGrouping);
export const selectSwimlanes = createSelector(selectKanban, s => s.swimlanes || []);

export const selectKanbanPageProps = createSelector(selectKanban, data => ({
  originKanbanSettings: data.originKanbanSettings,
  kanbanSettings: data.kanbanSettings,
  boardList: data.boardList,
  templateList: data.templateList,
  boardConfig: data.boardConfig,
  isLoading: data.isLoading,
  isEnabled: data.isEnabled,
  totalCount: data.totalCount,
  swimlaneGrouping: data.swimlaneGrouping
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
  isFiltered: data.isFiltered,
  isLoadingColumns: data.isLoadingColumns || [],
  page: data.pagination.page,
  selectedBoard: get(data, 'boardConfig.name'),
  swimlaneGrouping: data.swimlaneGrouping,
  swimlanes: data.swimlanes || []
}));

