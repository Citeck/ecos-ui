import { createAction } from 'redux-actions';

const prefix = 'timesheet/subordinates/';

export const initSubordinatesTimesheetStart = createAction(prefix + 'INIT_SUBORDINATES_TIMESHEET_START');
export const getSubordinatesTimesheetByParams = createAction(prefix + 'GET_SUBORDINATES_TIMESHEET_BY_PARAMS');
export const getSubordinatesList = createAction(prefix + 'GET_SUBORDINATES_LIST');
export const getCalendarEventList = createAction(prefix + 'GET_CALENDAR_EVENT_LIST');
export const getStatusList = createAction(prefix + 'GET_STATUS_LIST');

export const modifyTaskStatus = createAction(prefix + 'MODIFY_TASK_STATUS');
export const modifyEventDayHours = createAction(prefix + 'MODIFY_EVENT_DAY_HOURS');

export const initSubordinatesTimesheetEnd = createAction(prefix + 'INIT_SUBORDINATES_TIMESHEET_END');
export const setSubordinatesTimesheetByParams = createAction(prefix + 'SET_SUBORDINATES_TIMESHEET_BY_PARAMS');
export const setSubordinatesList = createAction(prefix + 'SET_SUBORDINATES_LIST');
export const setCalendarEventList = createAction(prefix + 'SET_CALENDAR_EVENT_LIST');
export const setStatusList = createAction(prefix + 'SET_STATUS_LIST');

export const setMergedList = createAction(prefix + 'SET_MERGED_LIST');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
