import { createAction } from 'redux-actions';

const prefix = 'menu/';

export const initMenuSettings = createAction(prefix + 'INIT_MENU_SETTINGS');
export const setMenuConfig = createAction(prefix + 'SET_MENU_CONFIG');
export const setResultSaveMenuConfig = createAction(prefix + 'SET_STATUS_SAVE_MENU_CONFIG');
export const setAvailableMenuItems = createAction(prefix + 'SET_AVAILABLE_MENU_ITEMS');

export const getMenuConfig = createAction(prefix + 'GET_MENU_CONFIG');
export const saveMenuConfig = createAction(prefix + 'SAVE_MENU_CONFIG');
export const getAvailableMenuItems = createAction(prefix + 'GET_AVAILABLE_MENU_ITEMS');
