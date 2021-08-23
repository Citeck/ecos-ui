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
    ...data.boardConfig,
    formProps: data.formProps,
    dataCards: data.dataCards || [],
    isLoading: data.isLoading
  })
);
