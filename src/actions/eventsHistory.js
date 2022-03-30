import { createAction } from 'redux-actions';

const prefix = 'eventsHistory/';

export const getEventsHistory = createAction(prefix + 'GET_EVENTS_HISTORY');
export const filterEventsHistory = createAction(prefix + 'FILTER_EVENTS_HISTORY');
export const getJournalConfig = createAction(prefix + 'GET_JOURNAL_CONFIG');

export const setEventsHistory = createAction(prefix + 'SET_EVENTS_HISTORY');
export const resetEventsHistory = createAction(prefix + 'RESET_EVENTS_HISTORY');
export const setJournalConfig = createAction(prefix + 'SET_JOURNAL_CONFIG');
