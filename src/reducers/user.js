import { handleActions } from 'redux-actions';
import { validateUserSuccess, validateUserFailure } from '../actions/user';

const initialState = {
  isInit: false,
  fullName: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [validateUserSuccess]: (state, action) => {
      return {
        ...state,
        isInit: true,
        fullName: action.payload.fullName
      };
    },
    [validateUserFailure]: state => {
      return {
        ...state,
        isInit: true
      };
    }
  },
  initialState
);
