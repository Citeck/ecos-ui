import { createAction } from 'redux-actions';

const prefix = 'comments/';

export const getComments = createAction(prefix + 'GET_COMMENTS');
export const setComments = createAction(prefix + 'SET_COMMENTS');

export const createCommentRequest = createAction(prefix + 'CREATE_COMMENT_REQUEST');
export const createCommentSuccess = createAction(prefix + 'CREATE_COMMENT_SUCCESS');

export const updateCommentRequest = createAction(prefix + 'UPDATE_COMMENT_REQUEST');
export const updateCommentSuccess = createAction(prefix + 'UPDATE_COMMENT_SUCCESS');

export const deleteCommentRequest = createAction(prefix + 'DELETE_COMMENT_REQUEST');
export const deleteCommentSuccess = createAction(prefix + 'DELETE_COMMENT_SUCCESS');

export const setError = createAction(prefix + 'SET_ERROR');

export const fetchStart = createAction(prefix + 'FETCH_START');
export const fetchEnd = createAction(prefix + 'FETCH_END');
export const sendingStart = createAction(prefix + 'SENDING_START');
export const sendingEnd = createAction(prefix + 'SENDING_END');

export const setActionFailedStatus = createAction(prefix + 'SET_ACTION_FAILED_STATUS');
