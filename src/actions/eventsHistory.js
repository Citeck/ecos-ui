import { createAction } from 'redux-actions';

const prefix = 'eventsHistory/';

export const getEventsHistory = createAction(prefix + 'GET_EVENTS_HISTORY');
export const filterEventsHistory = createAction(prefix + 'FILTER_EVENTS_HISTORY');

export const setEventsHistory = createAction(prefix + 'SET_EVENTS_HISTORY');
