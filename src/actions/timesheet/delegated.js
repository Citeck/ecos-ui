import { createAction } from 'redux-actions';

const prefix = 'timesheet/delegated/';

export const getDelegatedTimesheetByParams = createAction(prefix + 'GET_DELEGATED_TIMESHEET_BY_PARAMS');

export const setDelegatedTimesheetByParams = createAction(prefix + 'SET_DELEGATED_TIMESHEET_BY_PARAMS');
export const resetDelegatedTimesheet = createAction(prefix + 'RESET_DELEGATED_TIMESHEET');

export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
