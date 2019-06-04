import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings/';

export const initSettings = createAction(prefix + 'INIT_SETTINGS');
export const setWidgets = createAction(prefix + 'SET_WIDGETS');
export const setMenuItems = createAction(prefix + 'SET_MENU_ITEMS');
export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setStatusSaveConfigPage = createAction(prefix + 'SET_STATUS_SAVE_CONFIG_PAGE');

export const getWidgets = createAction(prefix + 'GET_WIDGETS');
export const getMenuItems = createAction(prefix + 'GET_MENU_ITEMS');
export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
