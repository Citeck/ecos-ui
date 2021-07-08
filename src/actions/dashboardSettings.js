import { createAction } from 'redux-actions';

const prefix = 'dashboard-settings/';

export const initDashboardSettings = createAction(prefix + 'INIT_DASHBOARD_SETTINGS');
export const setAvailableWidgets = createAction(prefix + 'SET_AVAILABLE_WIDGETS');
export const setDashboardKeys = createAction(prefix + 'SET_DASHBOARD_KEYS');
export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setRequestResultDashboard = createAction(prefix + 'SET_REQUEST_RESULT_DASHBOARD');
export const setCheckUpdatedDashboardConfig = createAction(prefix + 'SET_CHECK_UPDATED_DASHBOARD_CONFIG');
export const resetDashboardConfig = createAction(prefix + 'RESET_DASHBOARD_CONFIG');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const setLoadingKeys = createAction(prefix + 'SET_LOADING_KEYS');

export const setDashboardData = createAction(prefix + 'SET_DASHBOARD_DATA');

export const getAvailableWidgets = createAction(prefix + 'GET_AVAILABLE_WIDGETS');
export const getDashboardKeys = createAction(prefix + 'GET_DASHBOARD_KEYS');
export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
export const getCheckUpdatedDashboardConfig = createAction(prefix + 'GET_CHECK_UPDATED_DASHBOARD_CONFIG');
export const resetConfigToDefault = createAction(prefix + 'RESET_CONFIG_TO_DEFAULT');
