import { createAction } from 'redux-actions';

const prefix = 'user/';

export const validateUserRequest = createAction(prefix + 'VALIDATE_REQUEST');
export const validateUserSuccess = createAction(prefix + 'VALIDATE_SUCCESS');
export const validateUserFailure = createAction(prefix + 'VALIDATE_FAILURE');

export const setUserThumbnail = createAction(prefix + 'SET_THUMBNAIL');
export const setIsAuthenticated = createAction(prefix + 'SET_IS_AUTHENTICATED');
