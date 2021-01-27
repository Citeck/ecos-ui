import { createAction } from 'redux-actions';

const prefix = 'cmmn-editor/';

export const initData = createAction(prefix + 'INIT_DATA');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const getTitle = createAction(prefix + 'GET_TITLE');
export const setTitle = createAction(prefix + 'SET_TITLE');
export const getScenario = createAction(prefix + 'GET_SCENARIO');
export const setScenario = createAction(prefix + 'SET_SCENARIO');
export const saveScenario = createAction(prefix + 'SAVE_SCENARIO');
export const getFormData = createAction(prefix + 'GET_FORM_DATA');
export const setFormData = createAction(prefix + 'SET_FORM_DATA');
