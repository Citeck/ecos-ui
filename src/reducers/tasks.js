import { handleActions } from 'redux-actions';
import { getDashletTasks, setDashletTasks, changeTaskDetails, setSaveTaskResult } from '../actions/tasks';
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

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [getDashletTasks]: startLoading,
    [changeTaskDetails]: startLoading,
    [setDashletTasks]: (state, { payload }) => ({
      ...state,
      list: payload,
      isLoading: false
    }),
    [setSaveTaskResult]: (state, { payload }) => {
      const list = deepClone(state.list);
      const taskIndex = getIndexObjectByKV(list, 'id', payload.taskId);
      const {
        taskData,
        taskData: { stateAssign }
      } = payload;
      if ([AssignOptions.UNASSIGN, AssignOptions.ASSIGN_ME].includes(stateAssign)) {
        list[taskIndex] = { ...list[taskIndex], ...taskData };
      } else {
        list.splice(taskIndex, 1);
      }

      return {
        ...state,
        list,
        saveResult: payload,
        isLoading: false
      };
    }
  },
  initialState
);
