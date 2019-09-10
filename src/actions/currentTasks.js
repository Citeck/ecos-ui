import { createAction } from 'redux-actions';

const prefix = 'currentTasks/';

export const getCurrentTaskList = createAction(prefix + 'GET_CURRENT_TASK_LIST');
export const updateRequestCurrentTasks = createAction(prefix + 'UPDATE_REQUEST_CURRENT_TASK_LIST');

export const setCurrentTaskList = createAction(prefix + 'SET_CURRENT_TASK_LIST');
export const resetCurrentTaskList = createAction(prefix + 'RESET_CURRENT_TASK_LIST');
