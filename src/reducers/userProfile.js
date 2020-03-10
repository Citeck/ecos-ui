import { handleActions } from 'redux-actions';
import { changePassword, changePhoto, getUserData, setUserData } from '../actions/user';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  isLoadingPhoto: false,
  isLoadingPassword: false,
  data: {}
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
      const { stateId, ...data } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          ...data,
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
    [changePassword]: (state, { payload }) => {
      const { stateId } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          isLoadingPassword: true
        }
      };
    }
  },
  {}
);
