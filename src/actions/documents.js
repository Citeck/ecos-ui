import { createAction } from 'redux-actions';

const prefix = 'documents/';

export const init = createAction(prefix + 'INIT_WIDGET');
export const initSuccessful = createAction(prefix + 'INIT_WIDGET_SUCCESSFUL');

export const getDocumentTypes = createAction(prefix + 'GET_DOCUMENT_TYPES');
export const setDocumentTypes = createAction(prefix + 'SET_DOCUMENT_TYPES');

export const getAvailableTypes = createAction(prefix + 'GET_AVAILABLE_TYPES');
export const setAvailableTypes = createAction(prefix + 'SET_AVAILABLE_TYPES');

export const setDynamicTypes = createAction(prefix + 'SET_DYNAMIC_TYPES');

export const setDocuments = createAction(prefix + 'SET_DOCUMENTS');
export const getDocumentsByType = createAction(prefix + 'SET_DOCUMENTS_BY_TYPE');

export const toggleType = createAction(prefix + 'TOGGLE_TYPE_IN_SETTINGS');
