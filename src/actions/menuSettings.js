import { createAction } from 'redux-actions';

const prefix = 'menu-settings/';

export const setOpenMenuSettings = createAction(prefix + 'SET_OPEN_SETTINGS');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const getSettingsConfig = createAction(prefix + 'GET_SETTINGS_CONFIG');
export const setOriginalConfig = createAction(prefix + 'SET_ORIGINAL_CONFIG');
export const saveMenuSettings = createAction(prefix + 'SAVE_MENU_SETTINGS');
export const setMenuIcons = createAction(prefix + 'SET_MENU_ICONS');

export const getGroupPriority = createAction(prefix + 'GET_GROUP_PRIORITY');
export const setGroupPriority = createAction(prefix + 'SET_GROUP_PRIORITY');

export const addJournalMenuItems = createAction(prefix + 'ADD_JOURNAL_MENU_ITEMS');

export const setLeftMenuItems = createAction(prefix + 'SET_LEFT_MENU_ITEMS');
export const setLastAddedLeftItems = createAction(prefix + 'SET_LAST_ADDED_LEFT_ITEMS');

export const setCreateMenuItems = createAction(prefix + 'SET_CREATE_MENU_ITEMS');
export const setLastAddedCreateItems = createAction(prefix + 'SET_LAST_ADDED_Create_ITEMS');

export const setAuthorities = createAction(prefix + 'SET_AUTHORITIES');
export const getAuthorityInfoByRefs = createAction(prefix + 'GET_AUTHORITY_INFO_BY_REFS');

export const resetStore = createAction(prefix + 'RESET_STORE');
