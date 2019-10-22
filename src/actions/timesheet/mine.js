import { createAction } from 'redux-actions';

const prefix = 'timesheet/mine/';

export const getMyTimesheetByParams = createAction(prefix + 'GET_MY_TIMESHEET_BY_PARAMS');
export const getStatus = createAction(prefix + 'GET_STATUS');
export const getCalendarEventList = createAction(prefix + 'GET_CALENDAR_EVENT_LIST');
export const modifyStatus = createAction(prefix + 'MODIFY_STATUS');
export const modifyEventDayHours = createAction(prefix + 'MODIFY_EVENT_DAY_HOURS');
export const resetEventDayHours = createAction(prefix + 'RESET_EVENT_DAY_HOURS');

export const setMyTimesheetByParams = createAction(prefix + 'SET_MY_TIMESHEET_BY_PARAMS');
export const resetMyTimesheet = createAction(prefix + 'RESET_MY_TIMESHEET');
export const setCalendarEventList = createAction(prefix + 'SET_CALENDAR_EVENT_LIST');
export const setStatus = createAction(prefix + 'SET_STATUS');
export const setUpdatingStatus = createAction(prefix + 'SET_UPDATING_STATUS');
export const setUpdatingEventDayHours = createAction(prefix + 'SET_UPDATING_EVENT_DAY_HOURS');

export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
