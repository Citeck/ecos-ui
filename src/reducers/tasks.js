import { handleActions } from 'redux-actions';
import { getDashletTasks, setDashletTasks, changeTaskDetails, setSaveTaskResult } from '../actions/tasks';

const initialState = {
  isLoading: false,
  list: [],
  saveResult: {
    status: '',
    taskId: ''
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
    [setSaveTaskResult]: (state, { payload }) => ({
      ...state,
      saveResult: payload,
      isLoading: false
    })
  },
  initialState
);
