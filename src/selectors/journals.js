import { createSelector } from 'reselect';
import get from 'lodash/get';

import { defaultState } from '../reducers/journals';

const selectState = (state, key) => get(state, ['journals', key], { ...defaultState });
export const selectJournalSettings = createSelector(
  selectState,
  ownState => get(ownState, 'journalSetting', defaultState.journalSetting)
);
export const selectJournals = createSelector(
  selectState,
  ownState => get(ownState, 'journals', [])
);

export const selectJournalUiType = createSelector(
  (journals, id) => journals.find(journal => journal.nodeRef === id),
  journal => get(journal, 'uiType')
);
