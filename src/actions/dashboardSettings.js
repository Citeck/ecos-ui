import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings/';

export const initSettings = createAction(prefix + 'INIT_SETTINGS');
export const setAllWidgets = createAction(prefix + 'SET_ALL_WIDGETS');
export const setAllMenuItems = createAction(prefix + 'SET_ALL_MENU_ITEMS');
export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setDashboardKey = createAction(prefix + 'SET_DASHBOARD_KEY');
export const setResultSaveSettings = createAction(prefix + 'SET_STATUS_SAVE_SETTINGS');

export const getAllWidgets = createAction(prefix + 'GET_ALL_WIDGETS');
export const getAllMenuItems = createAction(prefix + 'GET_ALL_MENU_ITEMS');
export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveSettings = createAction(prefix + 'SAVE_SETTINGS');
