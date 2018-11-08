import { handleActions } from 'redux-actions';
import { validateUserSuccess, validateUserFailure } from '../actions/user';

const initialState = {
  isInit: false,
  fullName: '',
  nodeRef: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [validateUserSuccess]: (state, action) => {
      return {
        ...state,
        isInit: true,
        fullName: action.payload.fullName,
        nodeRef: action.payload.nodeRef
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
