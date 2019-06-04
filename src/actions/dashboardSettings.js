import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings/';

export const initSettings = createAction(prefix + 'INIT_SETTINGS');
export const setAllWidgets = createAction(prefix + 'SET_ALL_WIDGETS');
export const setAllMenuItems = createAction(prefix + 'SET_ALL_MENU_ITEMS');
export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setStatusSaveConfigPage = createAction(prefix + 'SET_STATUS_SAVE_CONFIG_PAGE');

export const getAllWidgets = createAction(prefix + 'GET_ALL_WIDGETS');
export const getAllMenuItems = createAction(prefix + 'GET_ALL_MENU_ITEMS');
export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
