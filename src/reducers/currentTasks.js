import { handleActions } from 'redux-actions';
import { changeTaskAssignee, getCurrentTaskList, setCurrentTaskList, setTaskAssignee } from '../actions/tasks';

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
    [getCurrentTaskList]: startLoading,
    [changeTaskAssignee]: startLoading,
    [setCurrentTaskList]: (state, { payload: { stateId, list } }) => ({
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
