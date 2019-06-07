import { createAction } from 'redux-actions';

const prefix = 'dashboard/';

export const setDashboardConfig = createAction(prefix + 'SET_DASHBOARD_CONFIG');
export const setDashboardKey = createAction(prefix + 'SET_DASHBOARD_KEY');

export const getDashboardConfig = createAction(prefix + 'GET_DASHBOARD_CONFIG');
export const saveDashboardConfig = createAction(prefix + 'SAVE_DASHBOARD_CONFIG');
