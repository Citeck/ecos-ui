import { createAction } from 'redux-actions';

const prefix = 'tasks/';

export const getDashletConfig = createAction(prefix + 'GET_DASHLET_CONFIG');
export const setDashletConfig = createAction(prefix + 'SET_DASHLET_CONFIG');
export const saveDashletConfig = createAction(prefix + 'SAVE_DASHLET_CONFIG');
export const setSaveTaskResult = createAction(prefix + 'SET_SAVE_TASK_RESULT');
