import { handleActions } from 'redux-actions';
import { getCurrentTaskList, resetCurrentTaskList, setCurrentTaskList, updateRequestCurrentTasks } from '../actions/currentTasks';
import { getCurrentStateById } from '../helpers/redux';

const commonInitialState = {
  updateRequestRecord: null
};

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
        },
        updateRequestRecord: null
      };
    },
    [updateRequestCurrentTasks]: (state, { payload: { record } }) => ({
      ...state,
      updateRequestRecord: record
    }),
    [resetCurrentTaskList]: (state, { payload: { stateId } }) => {
      delete state[stateId];

      return state;
    }
  },
  commonInitialState
);
