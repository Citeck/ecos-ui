import { handleActions } from 'redux-actions';
import { validateUserSuccess, validateUserFailure, setUserThumbnail, setIsAuthenticated } from '../actions/user';

const initialState = {
  firstName: '',
  lastName: '',
  middleName: '',
  userName: '',
  fullName: '',
  nodeRef: '',
  thumbnail: null,
  isAvailable: false,
  isMutable: false,
  isAuthenticated: false,
  isAdmin: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [validateUserSuccess]: (state, action) => {
      return {
        ...state,
        ...action.payload,
        isAvailable: action.payload.isAvailable === 'true',
        isMutable: action.payload.isMutable === 'true',
        isAdmin: action.payload.isAdmin === 'true',
        fullName: action.payload.fullName.trim(),
        nodeRef: `workspace://SpacesStore/${action.payload.uid}`,
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
