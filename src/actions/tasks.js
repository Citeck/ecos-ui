import { createAction } from 'redux-actions';

const prefix = 'tasks/';

export const getTaskList = createAction(prefix + 'GET_TASK_LIST');

export const setTaskList = createAction(prefix + 'SET_TASK_LIST');

export const changeTaskDetails = createAction(prefix + 'CHANGE_TASK_DETAILS');
export const setSaveTaskResult = createAction(prefix + 'SET_SAVE_TASK_RESULT');
