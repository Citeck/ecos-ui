import { createAction } from 'redux-actions';

const prefix = 'timesheet/verification/';

export const getVerificationTimesheetByParams = createAction(prefix + 'GET_VERIFICATION_TIMESHEET_BY_PARAMS');

export const setVerificationTimesheetByParams = createAction(prefix + 'SET_VERIFICATION_TIMESHEET_BY_PARAMS');
export const resetVerificationTimesheet = createAction(prefix + 'RESET_VERIFICATION_TIMESHEET');

export const setPopupMessage = createAction(prefix + 'SET_POPUP_MESSAGE');
