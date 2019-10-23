import { createAction } from 'redux-actions';

const prefix = 'timesheet/delegated/';

export const getDelegatedTimesheetByParams = createAction(prefix + 'GET_DELEGATED_TIMESHEET_BY_PARAMS');
export const setDelegatedTimesheetByParams = createAction(prefix + 'SET_DELEGATED_TIMESHEET_BY_PARAMS');
export const resetDelegatedTimesheet = createAction(prefix + 'RESET_DELEGATED_TIMESHEET');
export const setMergedList = createAction(prefix + 'SET_MERGED_LIST');

export const modifyStatus = createAction(prefix + 'MODIFY_STATUS');

export const modifyEventDayHours = createAction(prefix + 'MODIFY_EVENT_DAY_HOURS');
export const resetEventDayHours = createAction(prefix + 'RESET_EVENT_DAY_HOURS');
export const setUpdatingEventDayHours = createAction(prefix + 'SET_UPDATING_EVENT_DAY_HOURS');

export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
export const setLoading = createAction(prefix + 'SET_LOADING');
