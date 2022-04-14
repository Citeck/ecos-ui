import { createAction } from 'redux-actions';

const prefix = 'bpmn-editor/';

export const initData = createAction(prefix + 'INIT_DATA');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const getTitle = createAction(prefix + 'GET_TITLE');
export const setTitle = createAction(prefix + 'SET_TITLE');
export const getModel = createAction(prefix + 'GET_MODEL');
export const setModel = createAction(prefix + 'SET_MODEL');
export const saveModel = createAction(prefix + 'SAVE_MODEL');
export const getFormProps = createAction(prefix + 'GET_FORM_PROPS');
export const setFormProps = createAction(prefix + 'SET_FORM_PROPS');
export const setFormData = createAction(prefix + 'SET_FORM_DATA');
