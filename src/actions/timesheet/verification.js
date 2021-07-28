import { createAction } from 'redux-actions';

const prefix = 'timesheet/verification/';

export const getVerificationTimesheetByParams = createAction(prefix + 'GET_VERIFICATION_TIMESHEET_BY_PARAMS');
export const setVerificationTimesheetByParams = createAction(prefix + 'SET_VERIFICATION_TIMESHEET_BY_PARAMS');
export const resetVerificationTimesheet = createAction(prefix + 'RESET_VERIFICATION_TIMESHEET');
export const setMergedList = createAction(prefix + 'SET_MERGED_LIST');

export const modifyStatus = createAction(prefix + 'MODIFY_STATUS');

export const modifyEventDayHours = createAction(prefix + 'MODIFY_EVENT_DAY_HOURS');
export const resetEventDayHours = createAction(prefix + 'RESET_EVENT_DAY_HOURS');
export const setUpdatingEventDayHours = createAction(prefix + 'SET_UPDATING_EVENT_DAY_HOURS');

export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
export const setLoading = createAction(prefix + 'SET_LOADING');

export const getCalendarEvents = createAction(prefix + 'GET_CALENDAR_EVENTS');
export const setCalendarEvents = createAction(prefix + 'SET_CALENDAR_EVENTS');
