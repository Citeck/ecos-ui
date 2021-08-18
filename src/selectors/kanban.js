import { createSelector } from 'reselect';
import get from 'lodash/get';
import { initialState } from '../reducers/kanban';

export const selectKanban = (state, key) => get(state, ['kanban', key]) || { ...initialState };

export const selectBoardList = createSelector(
  selectKanban,
  state => get(state, 'boardList') || []
);

export const selectBoardConfig = createSelector(
  selectKanban,
  state => get(state, 'boardConfig') || {}
);

export const selectIsKanbanEnabled = createSelector(
  selectKanban,
  state => get(state, 'isEnabled') || false
);

export const selectKanbanPageProps = createSelector(
  selectKanban,
  data => ({
    boardList: data.boardList,
    boardConfig: data.boardConfig,
    isLoading: data.isLoading,
    isEnabled: data.isEnabled
  })
);
