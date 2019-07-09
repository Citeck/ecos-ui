import { createAction } from 'redux-actions';

const prefix = 'doc-status/';

export const initDocStatus = createAction(prefix + 'INIT_DOC_STATUS');

export const getDocStatus = createAction(prefix + 'GET_DOC_STATUS');

export const setDocStatus = createAction(prefix + 'SET_DOC_STATUS');
