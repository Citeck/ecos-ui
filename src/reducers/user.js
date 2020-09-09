import { handleActions } from 'redux-actions';
import {
  setIsAuthenticated,
  setNewUIAvailableStatus,
  setUserPhoto,
  setUserThumbnail,
  validateUserFailure,
  validateUserSuccess
} from '../actions/user';

const initialState = {
  id: '',
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
  isAdmin: false,
  isNewUIAvailable: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [validateUserSuccess]: (state, action) => {
      return {
        ...state,
        ...action.payload,
        isAvailable: action.payload.isAvailable,
        isMutable: action.payload.isMutable,
        isAdmin: action.payload.isAdmin,
        fullName: action.payload.fullName,
        nodeRef: action.payload.nodeRef,
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
    },
    [setNewUIAvailableStatus]: (state, action) => {
      return {
        ...state,
        isNewUIAvailable: action.payload
      };
    },
    [setUserPhoto]: (state, { payload }) => {
      const { stateId, thumbnail } = payload;
      if (state.id === stateId) {
        return {
          ...state,
          thumbnail
        };
      }

      return state;
    }
  },
  initialState
);
