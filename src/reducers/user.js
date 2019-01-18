import { handleActions } from 'redux-actions';
import { validateUserSuccess, validateUserFailure, setUserThumbnail, setIsAuthenticated } from '../actions/user';

const initialState = {
  name: '',
  fullName: '',
  nodeRef: '',
  thumbnail: null,
  isAvailable: false,
  isMutable: false,
  isAuthenticated: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [validateUserSuccess]: (state, action) => {
      return {
        ...state,
        name: action.payload.name,
        fullName: action.payload.fullName,
        nodeRef: action.payload.nodeRef,
        isAvailable: action.payload.isAvailable,
        isMutable: action.payload.isMutable,
        isAuthenticated: true
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
    },
    [setIsAuthenticated]: (state, action) => {
      return {
        ...state,
        isAuthenticated: action.payload
      };
    }
  },
  initialState
);
