import { createAction } from 'redux-actions';

const prefix = 'documents/';

export const init = createAction(prefix + 'INIT_WIDGET');

export const getDocumentTypes = createAction(prefix + 'GET_DOCUMENT_TYPES');
export const setDocumentTypes = createAction(prefix + 'SET_DOCUMENT_TYPES');
