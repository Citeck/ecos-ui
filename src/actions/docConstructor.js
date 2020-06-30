import { createAction } from 'redux-actions';

const prefix = 'docConstructor/';

export const setSettings = createAction(prefix + 'SET_SETTINGS');
export const setDocument = createAction(prefix + 'SET_DOCUMENT');
export const setError = createAction(prefix + 'SET_ERROR');
export const setLoading = createAction(prefix + 'SET_LOADING');

export const getSettings = createAction(prefix + 'GET_SETTINGS');
export const createDocument = createAction(prefix + 'CREATE_DOCUMENT');
export const recreateDocument = createAction(prefix + 'RECREATE_DOCUMENT');
export const getDocument = createAction(prefix + 'GET_DOCUMENT');
export const editDocument = createAction(prefix + 'EDIT_DOCUMENT');
export const deleteDocument = createAction(prefix + 'DELETE_DOCUMENT');
