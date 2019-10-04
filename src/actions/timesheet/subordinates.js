import { createAction } from 'redux-actions';

const prefix = 'timesheet/subordinates/';

export const initSubordinatesTimesheetStart = createAction(prefix + 'INIT_SUBORDINATES_TIMESHEET_START');
export const getSubordinatesList = createAction(prefix + 'GET_SUBORDINATES_LIST');
export const getEventsList = createAction(prefix + 'GET_EVENT_LIST');

export const initSubordinatesTimesheetEnd = createAction(prefix + 'INIT_SUBORDINATES_TIMESHEET_END');
export const setSubordinatesEventsList = createAction(prefix + 'SET_SUBORDINATES_EVENT_LIST');

export const setSubordinatesList = createAction(prefix + 'SET_SUBORDINATES_LIST');
export const setEventsList = createAction(prefix + 'SET_EVENT_LIST');
