import { createAction } from 'redux-actions';

const prefix = 'esign/';

export const init = createAction(prefix + 'INIT');

export const signDocument = createAction(prefix + 'SIGN_DOCUMENT');
export const signDocumentSuccess = createAction(prefix + 'SIGN_DOCUMENT_SUCCESS');
export const signDocumentError = createAction(prefix + 'SIGN_DOCUMENT_ERROR');
