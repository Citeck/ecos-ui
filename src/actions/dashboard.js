import { createAction } from 'redux-actions';

const prefix = 'dashboard/';

export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setMobileDashboardConfig = createAction(prefix + 'SET_MOBILE_DASHBOARD_CONFIG');
export const setDashboardIdentification = createAction(prefix + 'SET_DASHBOARD_IDENTIFICATION');
export const setRequestResultDashboard = createAction(prefix + 'SET_REQUEST_RESULT_DASHBOARD');
export const setDashboardTitleInfo = createAction(prefix + 'SET_TITLE_INFO');
export const setLoading = createAction(prefix + 'SET_DASHBOARD_LOADING');

export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
export const resetDashboardConfig = createAction(prefix + 'RESET_DASHBOARD_CONFIG');
export const resetAllDashboardsConfig = createAction(prefix + 'RESET_ALL_DASHBOARDS_CONFIG');
export const getDashboardTitle = createAction(prefix + 'GET_DASHBOARD_TITLE');

export const setWarningMessage = createAction(prefix + 'SET_WARNING_MESSAGE');
