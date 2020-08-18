import { createAction } from 'redux-actions';

const prefix = 'app/';

export const initAppRequest = createAction(prefix + 'INIT_APP');
export const initAppSuccess = createAction(prefix + 'INIT_APP_SUCCESS');
export const initAppFailure = createAction(prefix + 'INIT_APP_FAILURE');

export const initAppSettings = createAction(prefix + 'INIT_APP_SETTINGS');
export const setDashboardEditable = createAction(prefix + 'SET_DASHBOARD_EDITABLE');
export const getDashboardEditable = createAction(prefix + 'GET_DASHBOARD_EDITABLE');

export const getFooter = createAction(prefix + 'GET_FOOTER');
export const setFooter = createAction(prefix + 'SET_FOOTER');

export const backPageFromTransitionsHistory = createAction(prefix + 'BACK_PAGE_FROM_TRANSITIONS_HISTORY');
