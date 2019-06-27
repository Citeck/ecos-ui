import { handleActions } from 'redux-actions';
import { changeTaskAssignee, getTaskList, setSaveTaskResult, setTaskList } from '../actions/tasks';

const initialState = {
  isLoading: false,
  list: [],
  saveResult: {
    status: '',
    taskId: ''
  }
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
    [setSaveTaskResult]: (state, { payload: { stateId, result, list } }) => {
      return {
        ...state,
        [stateId]: {
          ...getCurrentStateTasksListId(state, stateId),
          list,
          saveResult: result,
          isLoading: false
        }
      };
    }
  },
  {}
);
