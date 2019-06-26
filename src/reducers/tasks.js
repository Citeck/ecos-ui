import { handleActions } from 'redux-actions';
import { getTaskList, setTaskList, changeTaskDetails, setSaveTaskResult } from '../actions/tasks';
import { deepClone } from '../helpers/util';
import { getIndexObjectByKV } from '../helpers/arrayOfObjects';
import { AssignOptions } from '../constants/tasks';

const initialState = {
  isLoading: false,
  list: [],
  saveResult: {
    status: '',
    taskId: '',
    taskData: {}
  }
};

const getCurrentStateTasksListId = (state, sourceId) => {
  const currentState = state[sourceId] || {};

  return { ...initialState, ...currentState };
};

const startLoading = (state, { payload: { sourceId } }) => ({
  ...state,
  [sourceId]: {
    ...getCurrentStateTasksListId(state, sourceId),
    isLoading: true
  }
});

export default handleActions(
  {
    [getTaskList]: startLoading,
    [changeTaskDetails]: startLoading,
    [setTaskList]: (state, { payload: { sourceId, list } }) => ({
      ...state,
      [sourceId]: {
        ...getCurrentStateTasksListId(state, sourceId),
        list: list,
        isLoading: false
      }
    }),
    [setSaveTaskResult]: (state, { payload: { sourceId, result } }) => {
      const list = deepClone((state[sourceId] || {}).list);
      const taskIndex = getIndexObjectByKV(list, 'id', result.taskId);
      const {
        taskData,
        taskData: { stateAssign }
      } = result;
      if ([AssignOptions.UNASSIGN, AssignOptions.ASSIGN_ME].includes(stateAssign)) {
        list[taskIndex] = { ...list[taskIndex], ...taskData };
      } else {
        list.splice(taskIndex, 1);
      }

      return {
        ...state,
        [sourceId]: {
          ...getCurrentStateTasksListId(state, sourceId),
          list,
          saveResult: result,
          isLoading: false
        }
      };
    }
  },
  {}
);
