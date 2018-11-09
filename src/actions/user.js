import { createAction } from 'redux-actions';

const prefix = 'user/';

export const validateUserRequest = createAction(prefix + 'VALIDATE_REQUEST');
export const validateUserSuccess = createAction(prefix + 'VALIDATE_SUCCESS');
export const validateUserFailure = createAction(prefix + 'VALIDATE_FAILURE');

export function checkThunk() {
  return (dispatch, getState, { api }) => {
    const state = getState();
    console.log(state);

    dispatch(validateUserRequest());

    setTimeout(() => {
      const state = getState();
      const userNodeRef = state.user.nodeRef;
      api.user.getPhotoSize(userNodeRef).then(photoSize => console.log(photoSize));
    }, 3000);
  };
}
