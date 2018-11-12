import { handleActions } from 'redux-actions';
import { validateUserSuccess, validateUserFailure, setUserThumbnail } from '../actions/user';

const initialState = {
  fullName: '',
  nodeRef: '',
  thumbnail: null,
  isAvailable: false,
  isMutable: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [validateUserSuccess]: (state, action) => {
      return {
        ...state,
        fullName: action.payload.fullName,
        nodeRef: action.payload.nodeRef,
        isAvailable: action.payload.isAvailable,
        isMutable: action.payload.isMutable
      };
    },
    [validateUserFailure]: state => {
      return {
        ...state
      };
    },
    [setUserThumbnail]: (state, action) => {
      return {
        ...state,
        thumbnail: action.payload
      };
    }
  },
  initialState
);
