import { handleActions } from 'redux-actions';
import { changePassword, changePhoto, getUserData, setChangePassword, setMessage, setUserData, setUserPhoto } from '../actions/user';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  isLoadingPhoto: false,
  isLoadingPassword: false,
  data: {},
  message: null
};

const startLoading = (state, { payload: { stateId } }) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateById(state, stateId, initialState),
    isLoading: true
  }
});

export default handleActions(
  {
    [getUserData]: startLoading,
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
    }
  },
  {}
);
