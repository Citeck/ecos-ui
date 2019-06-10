import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings/';

export const initDashboardSettings = createAction(prefix + 'INIT_DASHBOARD_SETTINGS');
export const setAllWidgets = createAction(prefix + 'SET_ALL_WIDGETS');
export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setDashboardKey = createAction(prefix + 'SET_DASHBOARD_KEY');
export const setResultSaveDashboardConfig = createAction(prefix + 'SET_RESULT_SAVE_DASHBOARD_CONFIG');

export const getAllWidgets = createAction(prefix + 'GET_ALL_WIDGETS');
export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
