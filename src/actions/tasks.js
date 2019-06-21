import { createAction } from 'redux-actions';

const prefix = 'tasks/';

export const getDashletTasks = createAction(prefix + 'GET_DASHLET_TASKS');

export const setDashletTasks = createAction(prefix + 'SET_DASHLET_TASKS');

export const changeTaskDetails = createAction(prefix + 'CHANGE_TASK_DETAILS');
export const setSaveTaskResult = createAction(prefix + 'SET_SAVE_TASK_RESULT');
