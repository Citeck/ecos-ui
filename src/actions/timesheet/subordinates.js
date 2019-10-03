import { createAction } from 'redux-actions';

const prefix = 'timesheet/subordinates/';

export const getSubordinatesList = createAction(prefix + 'GET_SUBORDINATES_LIST');
export const getSubordinatesEventsList = createAction(prefix + 'GET_SUBORDINATES_EVENT_LIST');

export const setSubordinatesList = createAction(prefix + 'SET_SUBORDINATES_LIST');
export const setSubordinatesEventsList = createAction(prefix + 'SET_SUBORDINATES_EVENT_LIST');
