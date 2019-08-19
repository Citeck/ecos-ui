import { createAction } from 'redux-actions';

const prefix = 'dashboard/';

export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setDashboardIdentification = createAction(prefix + 'SET_DASHBOARD_IDENTIFICATION');
export const setResultSaveDashboardConfig = createAction(prefix + 'SET_STATUS_SAVE_DASHBOARD_CONFIG');
export const setDashboardTitleInfo = createAction(prefix + 'SET_TITLE_INFO');
export const setLoading = createAction(prefix + 'SET_DASHBOARD_LOADING');

export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
export const resetDashboardConfig = createAction(prefix + 'RESET_DASHBOARD_CONFIG');
