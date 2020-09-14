import { createAction } from 'redux-actions';

const prefix = 'user/';

export const validateUserRequest = createAction(prefix + 'VALIDATE_REQUEST');
export const validateUserSuccess = createAction(prefix + 'VALIDATE_SUCCESS');
export const validateUserFailure = createAction(prefix + 'VALIDATE_FAILURE');

export const getUserData = createAction(prefix + 'GET_USER_DATA');
export const changePassword = createAction(prefix + 'CHANGE_USER_PASSWORD');
export const changePhoto = createAction(prefix + 'CHANGE_USER_PHOTO');

export const setUserData = createAction(prefix + 'SET_USER_DATA');
export const setUserPhoto = createAction(prefix + 'SET_USER_PHOTO');
export const setMessage = createAction(prefix + 'SET_PROFILE_MESSAGE');
export const setChangePassword = createAction(prefix + 'RESULT_USER_PASSWORD');
export const setUserThumbnail = createAction(prefix + 'SET_USER_THUMBNAIL');
export const setIsAuthenticated = createAction(prefix + 'SET_USER_IS_AUTHENTICATED');
export const setNewUIAvailableStatus = createAction(prefix + 'SET_NEW_UI_AVAILABLE_STATUS');

export const togglePasswordModal = createAction(prefix + 'TOGGLE_PASSWORD_MODAL');
