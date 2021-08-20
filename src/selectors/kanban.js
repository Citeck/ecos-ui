import { createSelector } from 'reselect';
import get from 'lodash/get';

import { selectJournalData, selectSettingsFilters } from './journals';
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

export const selectJournalInfo = createSelector(
  [selectJournalData, selectSettingsFilters],
  (journal, settingsFiltersData) => ({
    settingsFiltersData,
    journalConfig: journal.journalConfig
  })
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
    isLoading: data.isLoading
  })
);
