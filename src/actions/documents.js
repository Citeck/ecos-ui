import { createAction } from 'redux-actions';

const prefix = 'documents/';

export const getDocumentTypes = createAction(prefix + 'GET_DOCUMENT_TYPES');
