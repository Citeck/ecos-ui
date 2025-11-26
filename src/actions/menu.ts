import { createAction } from 'redux-actions';

const prefix = 'menu/';

export const initMenuConfig = createAction(prefix + 'INIT_MENU_SETTINGS');
export const setMenuConfig = createAction(prefix + 'SET_MENU_CONFIG');
export const setRequestResultMenuConfig = createAction(prefix + 'SET_REQUEST_RESULT_MENU_CONFIG');
export const setAvailableSoloItems = createAction(prefix + 'SET_AVAILABLE_MENU_SOLO_ITEMS');

export const getMenuConfig = createAction(prefix + 'GET_MENU_CONFIG');
export const saveMenuConfig = createAction(prefix + 'SAVE_MENU_CONFIG');
export const getAvailableSoloItems = createAction(prefix + 'GET_AVAILABLE_MENU_SOLO_ITEMS');
