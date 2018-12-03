import { createAction } from 'redux-actions';

const prefix = 'user/';

export const validateUserRequest = createAction(prefix + 'VALIDATE_REQUEST');
export const validateUserSuccess = createAction(prefix + 'VALIDATE_SUCCESS');
export const validateUserFailure = createAction(prefix + 'VALIDATE_FAILURE');

export const setUserThumbnail = createAction(prefix + 'SET_THUMBNAIL');

export function tryLoginRequest(payload) {
  return (dispatch, getState, { api, logger }) => {
    return api.user
      .doLogin(payload)
      .then(response => {
        console.log('response', response);
      })
      .catch(error => {
        console.log('error', error);
      });
  };
}
