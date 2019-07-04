import { handleActions } from 'redux-actions';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig, setResultSaveDashboardConfig } from '../actions/dashboard';

const initialState = {
  config: {
    columns: [],
    dashboardId: null,
    dashboardKey: null,
    type: ''
  },
  isLoading: false,
  saveResult: {
    status: '',
    dashboardId: ''
  }
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [getDashboardConfig]: startLoading,
    [saveDashboardConfig]: startLoading,

    [setDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: {
          ...state.config,
          ...payload
        },
        isLoading: false
      };
    },
    [setResultSaveDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        saveResult: payload,
        isLoading: false
      };
    }
  },
  initialState
);
