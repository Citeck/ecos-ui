import { handleActions } from 'redux-actions';
import { changeTaskAssignee, getTaskList, resetTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';
import { getCurrentStateById } from '../helpers/redux';

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
    [getTaskList]: startLoading,
    [changeTaskAssignee]: startLoading,
    [setTaskList]: (state, { payload }) => {
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
    [setTaskAssignee]: (state, { payload }) => {
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
    [resetTaskList]: (state, { payload: { stateId } }) => {
      delete state[stateId];

      return state;
    }
  },
  {}
);
