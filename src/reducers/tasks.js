import { handleActions } from 'redux-actions';
import { changeTaskAssignee, getTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';

const initialState = {
  isLoading: false,
  list: []
};

const getCurrentStateTasksListId = (state, stateId) => {
  const currentState = state[stateId] || {};

  return { ...initialState, ...currentState };
};

const startLoading = (state, { payload: { stateId } }) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateTasksListId(state, stateId),
    isLoading: true
  }
});

export default handleActions(
  {
    [getTaskList]: startLoading,
    [changeTaskAssignee]: startLoading,
    [setTaskList]: (state, { payload: { stateId, list } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateTasksListId(state, stateId),
        list: list,
        isLoading: false
      }
    }),
    [setTaskAssignee]: (state, { payload: { stateId, list } }) => {
      return {
        ...state,
        [stateId]: {
          ...getCurrentStateTasksListId(state, stateId),
          list,
          isLoading: false
        }
      };
    }
  },
  {}
);
