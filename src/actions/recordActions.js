import { createAction } from 'redux-actions';

const prefix = 'recordActions/';

export const getActions = createAction(prefix + 'GET_ACTIONS');
export const runExecuteAction = createAction(prefix + 'RUN_EXECUTE_ACTION');

export const setActions = createAction(prefix + 'SET_ACTIONS');
export const backExecuteAction = createAction(prefix + 'BACK_EXECUTE_ACTION');
export const resetActions = createAction(prefix + 'RESET_ACTIONS');
