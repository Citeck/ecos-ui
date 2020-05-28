import { createAction } from 'redux-actions';

const prefix = 'menu-settings/';

export const setOpenMenuSettings = createAction(prefix + 'SET_OPEN_SETTINGS');
export const initSettings = createAction(prefix + 'INIT_SETTINGS');
export const setSettingsConfig = createAction(prefix + 'SET_SETTINGS_CONFIG');
export const setCustomIcons = createAction(prefix + 'SET_CUSTOM_ICONS');
export const setMenuItems = createAction(prefix + 'SET_MENU_ITEMS');

export const getSettingsConfig = createAction(prefix + 'GET_SETTINGS_CONFIG');
export const saveSettingsConfig = createAction(prefix + 'SAVE_SETTINGS_CONFIG');
export const getCustomIcons = createAction(prefix + 'GET_CUSTOM_ICONS');
export const addJournalMenuItems = createAction(prefix + 'ADD_JOURNAL_MENU_ITEMS');
