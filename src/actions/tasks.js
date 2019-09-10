import { createAction } from 'redux-actions';

const prefix = 'tasks/';

export const getTaskList = createAction(prefix + 'GET_TASK_LIST');
export const changeTaskAssignee = createAction(prefix + 'CHANGE_TASK_ASSIGNEE');

export const setTaskList = createAction(prefix + 'SET_TASK_LIST');
export const setTaskAssignee = createAction(prefix + 'SET_TASK_ASSIGNEE');
export const resetTaskList = createAction(prefix + 'RESET_TASK_LIST');
