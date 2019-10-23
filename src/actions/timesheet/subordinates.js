import { createAction } from 'redux-actions';

const prefix = 'timesheet/subordinates/';

export const getSubordinatesTimesheetByParams = createAction(prefix + 'GET_SUBORDINATES_TIMESHEET_BY_PARAMS');
export const setSubordinatesTimesheetByParams = createAction(prefix + 'SET_SUBORDINATES_TIMESHEET_BY_PARAMS');
export const resetSubordinatesTimesheet = createAction(prefix + 'RESET_SUBORDINATES_TIMESHEET');
export const setMergedList = createAction(prefix + 'SET_MERGED_LIST');

export const modifyStatus = createAction(prefix + 'MODIFY_STATUS');

export const modifyEventDayHours = createAction(prefix + 'MODIFY_EVENT_DAY_HOURS');
export const resetEventDayHours = createAction(prefix + 'RESET_EVENT_DAY_HOURS');
export const setUpdatingEventDayHours = createAction(prefix + 'SET_UPDATING_EVENT_DAY_HOURS');

export const setLoading = createAction(prefix + 'SET_LOADING');
export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
