import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings';

export const setWidgets = createAction(prefix + 'SET_WIDGETS');
export const setMenuItems = createAction(prefix + 'SET_MENU_ITEMS');
export const setConfigPage = createAction(prefix + 'SET_CONFIG_PAGE');
export const setStatusSaveConfigPage = createAction(prefix + 'SET_STATUS_SAVE_CONFIG_PAGE');

export const getWidgets = createAction(prefix + 'GET_WIDGETS');
export const getMenuItems = createAction(prefix + 'GET_MENU_ITEMS');
export const getConfigPage = createAction(prefix + 'GET_CONFIG_PAGE');
export const saveConfigPage = createAction(prefix + 'SAVE_CONFIG_PAGE');
