import { createSelector } from 'reselect';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { initialState } from '../reducers/kanban';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

export const selectKanban = (state, key) => get(state, ['kanban', key]) || { ...initialState };

export const selectBoardList = createSelector(
  selectKanban,
  state => get(state, 'boardList') || []
);

export const selectBoardConfig = createSelector(
  selectKanban,
  state => get(state, 'boardConfig') || {}
);

export const selectFormProps = createSelector(
  selectKanban,
  state => get(state, 'formProps') || {}
);

export const selectIsKanbanEnabled = createSelector(
  selectKanban,
  state => get(state, 'isEnabled') || false
);

export const selectPagination = createSelector(
  selectKanban,
  state => cloneDeep(get(state, 'pagination', DEFAULT_PAGINATION))
);

export const selectKanbanPageProps = createSelector(
  selectKanban,
  data => ({
    boardList: data.boardList,
    boardConfig: data.boardConfig,
    isLoading: data.isLoading,
    isEnabled: data.isEnabled,
    totalCount: data.totalCount
  })
);

export const selectKanbanProps = createSelector(
  selectKanban,
  data => ({
    columns: get(data, 'boardConfig.columns'),
    formProps: data.formProps,
    dataCards: data.dataCards || [],
    resolvedActions: data.resolvedActions,
    totalCount: data.totalCount,
    isLoading: data.isLoading,
    isFirstLoading: data.isFirstLoading,
    page: data.pagination.page
  })
);

export const selectColumnData = (state, key, index) => get(state, ['kanban', key, 'dataCards', index]) || {};
export const selectCardActions = (state, key, index) => get(state, ['kanban', key, 'resolvedActions', index]) || {};
export const selectColumnProps = createSelector(
  [selectKanban, selectColumnData, selectCardActions],
  (board, column, actions) => ({
    columns: get(board, 'boardConfig.columns'),
    readOnly: get(board, 'boardConfig.readOnly'),
    records: column.records,
    error: column.error,
    actions,
    formProps: board.formProps,
    isLoading: board.isLoading,
    isFirstLoading: board.isFirstLoading,
    isFiltered: board.isFiltered
  })
);
