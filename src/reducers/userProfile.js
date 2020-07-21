import { handleActions } from 'redux-actions';
import {
  changePassword,
  changePhoto,
  getUserData,
  setChangePassword,
  setMessage,
  setUserData,
  setUserPhoto,
  togglePasswordModal
} from '../actions/user';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  isLoadingPhoto: false,
  isLoadingPassword: false,
  isOpenPasswordModal: false,
  data: {},
  message: null
};

export default handleActions(
  {
    [getUserData]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        isLoading: true
      }
    }),
    [setUserData]: (state, { payload }) => {
      const { stateId, ...res } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          ...res,
          isLoading: false
        }
      };
    },
    [changePhoto]: (state, { payload }) => {
      const { stateId } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          isLoadingPhoto: true
        }
      };
    },
    [setUserPhoto]: (state, { payload }) => {
      const { stateId, thumbnail } = payload;
      const current = getCurrentStateById(state, stateId, initialState);

      return {
        ...state,
        [stateId]: {
          ...current,
          data: {
            ...current.data,
            thumbnail
          },
          isLoadingPhoto: false
        }
      };
    },
    [changePassword]: (state, { payload }) => {
      const { stateId } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          isLoadingPassword: true
        }
      };
    },
    [setChangePassword]: (state, { payload }) => {
      const { stateId } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          isLoadingPassword: false
        }
      };
    },
    [setMessage]: (state, { payload }) => {
      const { stateId, message = {}, ...extra } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          message,
          ...extra
        }
      };
    },
    [togglePasswordModal]: (state, { payload }) => {
      const { stateId, isOpen } = payload;
      const currentState = getCurrentStateById(state, stateId, initialState);
      const isOpenPasswordModal = isOpen === undefined ? !currentState.isOpenPasswordModal : isOpen;

      return {
        ...state,
        [stateId]: {
          ...currentState,
          isOpenPasswordModal
        }
      };
    }
  },
  {}
);
