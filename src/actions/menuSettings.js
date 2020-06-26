import { createAction } from 'redux-actions';

const prefix = 'menu-settings/';

export const setOpenMenuSettings = createAction(prefix + 'SET_OPEN_SETTINGS');
export const initSettings = createAction(prefix + 'INIT_SETTINGS');
export const setSettingsConfig = createAction(prefix + 'SET_SETTINGS_CONFIG');
export const setMenuItems = createAction(prefix + 'SET_MENU_ITEMS');
export const setLastAddedItems = createAction(prefix + 'SET_LAST_ADDED_ITEMS');
export const setGroupPriority = createAction(prefix + 'SET_GROUP_PRIORITY');

export const getSettingsConfig = createAction(prefix + 'GET_SETTINGS_CONFIG');
export const saveSettingsConfig = createAction(prefix + 'SAVE_SETTINGS_CONFIG');
export const addJournalMenuItems = createAction(prefix + 'ADD_JOURNAL_MENU_ITEMS');
export const getGroupPriority = createAction(prefix + 'GET_GROUP_PRIORITY');
export const saveGroupPriority = createAction(prefix + 'SAVE_GROUP_PRIORITY');
