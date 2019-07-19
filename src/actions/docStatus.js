import { createAction } from 'redux-actions';

const prefix = 'doc-status/';

export const initDocStatus = createAction(prefix + 'INIT_DOC_STATUS');

export const getDocStatus = createAction(prefix + 'GET_DOC_STATUS');
export const changeDocStatus = createAction(prefix + 'CHANGE_DOC_STATUS');
export const getAvailableStatuses = createAction(prefix + 'GET_AVAILABLE_STATUSES');
export const getCheckDocStatus = createAction(prefix + 'GET_CHECK_DOC_STATUS');

export const setDocStatus = createAction(prefix + 'SET_DOC_STATUS');
export const setAvailableStatuses = createAction(prefix + 'SET_AVAILABLE_STATUSES');
export const setCheckDocStatus = createAction(prefix + 'SET_CHECK_DOC_STATUS');
