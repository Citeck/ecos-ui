import { createAction } from 'redux-actions';

const prefix = 'currentTasks/';

export const initCurrentTasks = createAction(prefix + 'INIT_CURRENT_TASKS');
export const getCurrentTaskList = createAction(prefix + 'GET_CURRENT_TASK_LIST');
export const getActions = createAction(prefix + 'GET_ACTIONS');
export const executeAction = createAction(prefix + 'EXECUTE_ACTION');

export const setCurrentTaskList = createAction(prefix + 'SET_CURRENT_TASK_LIST');
export const setActions = createAction(prefix + 'SET_ACTIONS');
export const setInlineTools = createAction(prefix + 'SET_INLINE_TOOLS');
export const resetCurrentTaskList = createAction(prefix + 'RESET_CURRENT_TASK_LIST');
