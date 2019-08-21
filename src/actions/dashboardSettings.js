import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings/';

export const initDashboardSettings = createAction(prefix + 'INIT_DASHBOARD_SETTINGS');
export const setAvailableWidgets = createAction(prefix + 'SET_AVAILABLE_WIDGETS');
export const setDashboardKeys = createAction(prefix + 'SET_DASHBOARD_KEYS');
export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setResultSaveDashboardConfig = createAction(prefix + 'SET_RESULT_SAVE_DASHBOARD_CONFIG');

export const getAwayFromPage = createAction(prefix + 'GET_AWAY_FROM_PAGE');

export const getAvailableWidgets = createAction(prefix + 'GET_AVAILABLE_WIDGETS');
export const getDashboardKeys = createAction(prefix + 'GET_DASHBOARD_KEYS');
export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
