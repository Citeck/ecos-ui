import { createSelector } from 'reselect';
import get from 'lodash/get';

import { defaultState } from '../reducers/journals';
import { JOURNAL_DASHLET_CONFIG_VERSION } from '../components/Journals/constants';

const selectState = (state, key) => get(state, ['journals', key], { ...defaultState }) || {};

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

export const selectUrl = (state, id) => get(state, ['journals', id, 'url']) || {};

export const selectJournalData = selectState;

export const selectNewVersionDashletConfig = createSelector(
  selectState,
  ownProps => get(ownProps, ['config', JOURNAL_DASHLET_CONFIG_VERSION], null)
);

export const selectDashletConfig = createSelector(
  selectState,
  ownProps => get(ownProps, 'config', null)
);
