import { createAction } from 'redux-actions';

const prefix = 'esign/';

export const init = createAction(prefix + 'INIT');

export const setApi = createAction(prefix + 'SET_API');

export const setError = createAction(prefix + 'SET_ERROR');

export const getCertificates = createAction(prefix + 'GET_CERTIFICATES');
export const setCertificates = createAction(prefix + 'SET_CERTIFICATES');

export const signDocument = createAction(prefix + 'SIGN_DOCUMENT');
export const signDocumentSuccess = createAction(prefix + 'SIGN_DOCUMENT_SUCCESS');
export const signDocumentError = createAction(prefix + 'SIGN_DOCUMENT_ERROR');
