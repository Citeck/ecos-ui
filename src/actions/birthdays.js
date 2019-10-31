import { createAction } from 'redux-actions';

const prefix = 'birthdays/';

export const init = createAction(prefix + 'INIT_STORE');
export const getBirthdays = createAction(prefix + 'GET_BIRTHDAYS');
export const setBirthdays = createAction(prefix + 'SET_BIRTHDAYS');
