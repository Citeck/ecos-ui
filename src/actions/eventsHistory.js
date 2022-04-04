import { createAction } from 'redux-actions';

const prefix = 'eventsHistory/';

export const getEventsHistory = createAction(prefix + 'GET_EVENTS_HISTORY');
export const getJournalHistory = createAction(prefix + 'GET_JOURNAL_HISTORY');
export const filterJournalHistory = createAction(prefix + 'FILTER_JOURNAL_HISTORY');

export const setEventsHistory = createAction(prefix + 'SET_EVENTS_HISTORY');
export const resetEventsHistory = createAction(prefix + 'RESET_EVENTS_HISTORY');
export const setJournalHistory = createAction(prefix + 'SET_JOURNAL_HISTORY');
