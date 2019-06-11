import { createAction } from 'redux-actions';

const prefix = 'menuConfig/';

export const initMenuSettings = createAction(prefix + 'INIT_MENU_SETTINGS');
export const setUserMenuConfig = createAction(prefix + 'SET_USER_MENU_CONFIG');
export const setResultSaveUserMenu = createAction(prefix + 'SET_STATUS_SAVE_USER_MENU');
export const setAllMenuItems = createAction(prefix + 'SET_ALL_MENU_ITEMS');

export const getUserMenuConfig = createAction(prefix + 'GET_USER_MENU_CONFIG');
export const saveUserMenuConfig = createAction(prefix + 'SAVE_USER_MENU_CONFIG');
export const getAllMenuItems = createAction(prefix + 'GET_ALL_MENU_ITEMS');
