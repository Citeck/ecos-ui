import { handleActions } from 'redux-actions';
import { getFormList, resetData, setFormList } from '../actions/properties';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  forms: {
    list: [],
    isLoading: false,
    totalCount: 0
  }
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
    [getFormList]: (state, { payload }) => {
      const { stateId, ...data } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          forms: initialState.forms
        }
      };
    },
    [setFormList]: (state, { payload }) => {
      const { stateId, ...data } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          forms: {
            ...data,
            isLoading: false
          }
        }
      };
    },
    [resetData]: (state, { payload: { stateId } }) => {
      delete state[stateId];

      return state;
    }
  },
  {}
);
