import { createAction } from 'redux-actions';

const prefix = 'timesheet/mine/';

export const initMyTimesheetStart = createAction(prefix + 'INIT_MY_TIMESHEET_START');
export const getMyTimesheetByParams = createAction(prefix + 'GET_MY_TIMESHEET_BY_PARAMS');
export const getStatus = createAction(prefix + 'GET_STATUS');
export const getCalendarEventList = createAction(prefix + 'GET_CALENDAR_EVENT_LIST');
export const modifyStatus = createAction(prefix + 'MODIFY_STATUS');

export const initMyTimesheetEnd = createAction(prefix + 'INIT_MY_TIMESHEET_END');
export const setMyTimesheetByParams = createAction(prefix + 'SET_MY_TIMESHEET_BY_PARAMS');
export const setStatus = createAction(prefix + 'SET_STATUS');
export const setCalendarEventList = createAction(prefix + 'SET_CALENDAR_EVENT_LIST');

export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
