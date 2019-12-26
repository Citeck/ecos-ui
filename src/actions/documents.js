import { createAction } from 'redux-actions';

const prefix = 'documents/';

export const init = createAction(prefix + 'INIT_WIDGET');

export const getDocumentTypes = createAction(prefix + 'GET_DOCUMENT_TYPES');
export const setDocumentTypes = createAction(prefix + 'SET_DOCUMENT_TYPES');

export const getAvailableTypes = createAction(prefix + 'GET_AVAILABLE_TYPES');
export const setAvailableTypes = createAction(prefix + 'SET_AVAILABLE_TYPES');

export const setDynamicTypes = createAction(prefix + 'SET_DYNAMIC_TYPES');

export const setDocuments = createAction(prefix + 'SET_DOCUMENTS');
