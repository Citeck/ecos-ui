import { createAction } from 'redux-actions';

const prefix = 'journal/';

export const initRequest = createAction(prefix + 'INIT_REQUEST');
