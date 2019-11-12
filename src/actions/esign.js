import { createAction } from 'redux-actions';

const prefix = 'esign/';

export const init = createAction(prefix + 'INIT');
export const initSuccess = createAction(prefix + 'INIT_SUCCESS');
export const initError = createAction(prefix + 'INIT_ERROR');

export const fetchApi = createAction(prefix + 'FETCH_API');
export const setApi = createAction(prefix + 'SET_API');

export const toggleSignModal = createAction(prefix + 'TOGGLE_SIGN_MODAL');

export const setMessage = createAction(prefix + 'SET_MESSAGE');
export const clearMessage = createAction(prefix + 'CLEAR_MESSAGE');
export const setErrorType = createAction(prefix + 'SET_ERROR_TYPE');

export const getCertificates = createAction(prefix + 'GET_CERTIFICATES');
export const setCertificates = createAction(prefix + 'SET_CERTIFICATES');

export const signDocument = createAction(prefix + 'SIGN_DOCUMENT');
export const signDocumentSuccess = createAction(prefix + 'SIGN_DOCUMENT_SUCCESS');
export const signDocumentError = createAction(prefix + 'SIGN_DOCUMENT_ERROR');
