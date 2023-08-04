import { createAction } from 'redux-actions';

const prefix = 'dmn-editor/';

export const initData = createAction(prefix + 'INIT_DATA');
export const setLoading = createAction(prefix + 'SET_LOADING');

export const getTitle = createAction(prefix + 'GET_TITLE');
export const setTitle = createAction(prefix + 'SET_TITLE');

export const getModel = createAction(prefix + 'GET_MODEL');
export const setModel = createAction(prefix + 'SET_MODEL');

export const getFormProps = createAction(prefix + 'GET_FORM_PROPS');
export const setFormProps = createAction(prefix + 'SET_FORM_PROPS');
export const setFormData = createAction(prefix + 'SET_FORM_DATA');
export const setLoaderFormData = createAction(prefix + 'SET_LOADER_FORM_DATA');

export const saveModel = createAction(prefix + 'SAVE_MODEL');

export const getHasDeployRights = createAction(prefix + 'GET_HAS_DEPLOY_RIGHTS');
export const setHasDeployRights = createAction(prefix + 'SET_HAS_DEPLOY_RIGHTS');

export const setIsTableView = createAction(prefix + 'SET_IS_TABLE_VIEW');
