import { handleActions } from 'redux-actions';
import { getCurrentTaskList, resetCurrentTaskList, setCurrentTaskList } from '../actions/currentTasks';
import { getCurrentStateById } from '../helpers/redux';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  list: [],
  totalCount: 0
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
    [getCurrentTaskList]: startLoading,
    [setCurrentTaskList]: (state, { payload }) => {
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
    [resetCurrentTaskList]: (state, { payload: { stateId } }) => {
      delete state[stateId];

      return state;
    }
  },
  commonInitialState
);
