import { createAction } from 'redux-actions';

const prefix = 'docStatus/';

export const initDocStatus = createAction(prefix + 'INIT_DOC_STATUS');

export const getDocStatus = createAction(prefix + 'GET_DOC_STATUS');
export const changeDocStatus = createAction(prefix + 'CHANGE_DOC_STATUS');
export const getAvailableToChangeStatuses = createAction(prefix + 'GET_AVAILABLE_TO_CHANGE_STATUSES');
export const getCheckDocStatus = createAction(prefix + 'GET_CHECK_DOC_STATUS');

export const setDocStatus = createAction(prefix + 'SET_DOC_STATUS');
export const setAvailableToChangeStatuses = createAction(prefix + 'SET_AVAILABLE_TO_CHANGE_STATUSES');
export const setCheckDocStatus = createAction(prefix + 'SET_CHECK_DOC_STATUS');
export const updateRequestDocStatus = createAction(prefix + 'UPDATE_REQUEST_DOC_STATUS');
export const updateDocStatus = createAction(prefix + 'UPDATE_DOC_STATUS');
export const resetDocStatus = createAction(prefix + 'RESET_DOC_STATUS');
