import { createAction } from 'redux-actions';

const prefix = 'birthdays/';

export const initStore = createAction(prefix + 'INIT_STORE_RECORD');
export const resetStore = createAction(prefix + 'RESET_STORE_RECORD');
export const getBirthdays = createAction(prefix + 'GET_BIRTHDAYS');
export const setBirthdays = createAction(prefix + 'SET_BIRTHDAYS');
export const setError = createAction(prefix + 'SET_ERROR');
