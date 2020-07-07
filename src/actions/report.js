import { createAction } from 'redux-actions';

const prefix = 'report/';

export const getReportData = createAction(prefix + 'GET_REPORT_DATA');
export const setReportData = createAction(prefix + 'SET_REPORT_DATA');
export const resetStore = createAction(prefix + 'RESET_STORE_REPORT');
