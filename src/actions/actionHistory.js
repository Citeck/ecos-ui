import { createAction } from 'redux-actions';

const prefix = 'actionHistory/';

export const getActionHistory = createAction(prefix + 'GET_ACTION_HISTORY');

export const setActionHistory = createAction(prefix + 'SET_ACTION_HISTORY');
