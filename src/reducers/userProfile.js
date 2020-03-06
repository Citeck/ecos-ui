import { handleActions } from 'redux-actions';
import { getUserData, setUserData } from '../actions/user';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
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
    }
  },
  {}
);
