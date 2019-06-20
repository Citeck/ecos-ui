import { handleActions } from 'redux-actions';
import { getDashletConfig, setDashletConfig, saveDashletConfig, setSaveTaskResult } from '../actions/tasks';

const initialState = {
  isLoading: false,
  tasks: [],
  saveResult: {
    status: '',
    taskId: ''
  }
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [getDashletConfig]: startLoading,
    [saveDashletConfig]: startLoading,
    [setDashletConfig]: (state, { payload }) => ({
      ...state,
      tasks: payload,
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
