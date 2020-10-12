import { handleActions } from 'redux-actions';
import { changePhoto, getUserData, setMessage, setUserData, setUserPhoto } from '../actions/user';
import { getCurrentStateById, startLoading } from '../helpers/redux';

const initialState = {
  isLoading: false,
  isLoadingPhoto: false,
  data: {},
  message: null
};

export default handleActions(
  {
    [getUserData]: startLoading(initialState),
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
