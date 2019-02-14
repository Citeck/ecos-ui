import { createAction } from 'redux-actions';

const prefix = 'journals/';

export const getDashletConfig = createAction(prefix + 'GET_DASHLET_CONFIG');
export const setDashletIsReady = createAction(prefix + 'SET_DASHLET_IS_READY');
export const setDashletConfig = createAction(prefix + 'SET_DASHLET_CONFIG');
export const saveDashlet = createAction(prefix + 'SAVE_DASHLET');

export const getDashletEditorData = createAction(prefix + 'GET_DASHLET_EDITOR_DATA');
export const setDashletEditorVisible = createAction(prefix + 'SET_DASHLET_EDITOR_VISIBLE');

export const setJournalsListItem = createAction(prefix + 'SET_JOURNALS_LIST_ITEM');
export const setJournalsItem = createAction(prefix + 'SET_JOURNALS_ITEM');
export const setSettingItem = createAction(prefix + 'SET_SETTING_ITEM');
export const setJournalsList = createAction(prefix + 'SET_JOURNALS_LIST');
export const setJournals = createAction(prefix + 'SET_JOURNALS');

export const setJournalConfig = createAction(prefix + 'SET_JOURNAL_CONFIG');
export const setGrid = createAction(prefix + 'SET_GRID');
export const reloadGrid = createAction(prefix + 'RELOAD_GRID');
