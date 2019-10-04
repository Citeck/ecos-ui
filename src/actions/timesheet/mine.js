import { createAction } from 'redux-actions';

const prefix = 'timesheet/mine/';

export const initMyTimesheetStart = createAction(prefix + 'INIT_MY_TIMESHEET_START');
export const getStatus = createAction(prefix + 'GET_STATUS');

export const initMyTimesheetEnd = createAction(prefix + 'INIT_MY_TIMESHEET_END');
export const setStatus = createAction(prefix + 'SET_STATUS');
