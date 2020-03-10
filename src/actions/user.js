import { createAction } from 'redux-actions';

const prefix = 'user/';

export const validateUserRequest = createAction(prefix + 'VALIDATE_REQUEST');
export const validateUserSuccess = createAction(prefix + 'VALIDATE_SUCCESS');
export const validateUserFailure = createAction(prefix + 'VALIDATE_FAILURE');

export const getUserData = createAction(prefix + 'GET_USER_DATA');
export const changePassword = createAction(prefix + 'GET_USER_DATA');
export const changePhoto = createAction(prefix + 'GET_USER_DATA');

export const setUserData = createAction(prefix + 'SET_USER_DATA');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const setUserThumbnail = createAction(prefix + 'SET_USER_THUMBNAIL');
export const setIsAuthenticated = createAction(prefix + 'SET_USER_IS_AUTHENTICATED');
