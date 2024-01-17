import { createAction } from 'redux-actions';

const prefix = 'process-admin/';

export const getAllVersions = createAction(prefix + 'GET_ALL_VERSIONS');
export const setAllVersions = createAction(prefix + 'SET_ALL_VERSIONS');

export const getActionsInfo = createAction(prefix + 'GET_ACTIONS_INFO');
export const setActionsInfo = createAction(prefix + 'SET_ACTIONS_INFO');

export const getMetaInfo = createAction(prefix + 'GET_META_INFO');
export const setMetaInfo = createAction(prefix + 'SET_META_INFO');

export const getJournalTabInfo = createAction(prefix + 'GET_JOURNAL_TAB_INFO');
export const setJournalTabInfo = createAction(prefix + 'SET_JOURNAL_TAB_INFO');
export const setJournalTabInfoPage = createAction(prefix + 'SET_JOURNAL_TAB_INFO_PAGE');
export const setJournalTabInfoFilters = createAction(prefix + 'SET_JOURNAL_TAB_INFO_FILTERS');
export const setJournalTabInfoSortBy = createAction(prefix + 'SET_JOURNAL_TAB_INFO_SORT_BY');
