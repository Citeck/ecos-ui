import { createAction } from 'redux-actions';

const prefix = 'instance-admin/';

export const getMetaInfo = createAction(prefix + 'GET_META_INFO');
export const setMetaInfo = createAction(prefix + 'SET_META_INFO');

export const getActionsInfo = createAction(prefix + 'GET_ACTIONS_INFO');
export const setActionsInfo = createAction(prefix + 'SET_ACTIONS_INFO');

export const getJournalTabInfo = createAction(prefix + 'GET_JOURNAL_TAB_INFO');
export const setJournalTabInfo = createAction(prefix + 'SET_JOURNAL_TAB_INFO');
export const setJournalTabInfoPage = createAction(prefix + 'SET_JOURNAL_TAB_INFO_PAGE');
export const setJournalTabInfoFilters = createAction(prefix + 'SET_JOURNAL_TAB_INFO_FILTERS');
export const setJournalTabInfoSortBy = createAction(prefix + 'SET_JOURNAL_TAB_INFO_SORT_BY');

export const deleteInstance = createAction(prefix + 'DELETE_INSTANCE');
export const suspendInstance = createAction(prefix + 'SUSPEND_INSTANCE');
export const activateInstance = createAction(prefix + 'ACTIVATE_INSTANCE');
export const addVariableToInstance = createAction(prefix + 'ADD_VARIABLE_TO_INSTANCE');
