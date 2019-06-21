import { createAction } from 'redux-actions';

const prefix = 'comments/';

export const getComments = createAction(prefix + 'GET_COMMENTS');
export const createComment = createAction(prefix + 'CREATE_COMMENT');
export const updateComment = createAction(prefix + 'UPDATE_COMMENT');
export const deleteComment = createAction(prefix + 'DELETE_COMMENT');
export const setError = createAction(prefix + 'SET_ERROR');
