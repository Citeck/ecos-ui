import { createAction } from 'redux-actions';

const prefix = 'docConstructor/';

export const setFullSettings = createAction(prefix + 'SET_SETTINGS');
export const setDocument = createAction(prefix + 'SET_DOCUMENT');
export const setError = createAction(prefix + 'SET_ERROR');
export const setLoading = createAction(prefix + 'SET_LOADING');

export const getFullSettings = createAction(prefix + 'GET_SETTINGS');
export const getDocumentParams = createAction(prefix + 'GET_DOCUMENT_PARAMS');
export const createDocument = createAction(prefix + 'CREATE_DOCUMENT');
export const recreateDocument = createAction(prefix + 'RECREATE_DOCUMENT');
export const getDocument = createAction(prefix + 'GET_DOCUMENT');
export const editDocument = createAction(prefix + 'EDIT_DOCUMENT');
export const deleteDocument = createAction(prefix + 'DELETE_DOCUMENT');
