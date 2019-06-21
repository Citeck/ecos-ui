import { createAction } from 'redux-actions';

const prefix = 'comments/';

export const getComments = createAction(prefix + 'GET_COMMENTS');
export const setComments = createAction(prefix + 'SET_COMMENTS');

export const createComment = createAction(prefix + 'CREATE_COMMENT');
export const updateComment = createAction(prefix + 'UPDATE_COMMENT');
export const deleteComment = createAction(prefix + 'DELETE_COMMENT');

export const setError = createAction(prefix + 'SET_ERROR');

export const fetchStart = createAction(prefix + 'FETCH_START');
export const fetchEnd = createAction(prefix + 'FETCH_END');
export const sendingStart = createAction(prefix + 'SENDING_START');
export const sendingEnd = createAction(prefix + 'SENDING_END');
