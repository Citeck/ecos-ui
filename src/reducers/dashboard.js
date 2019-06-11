import { handleActions } from 'redux-actions';
import {
  getDashboardConfig,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardKey,
  setResultSaveDashboardConfig
} from '../actions/dashboard';

const initialState = {
  dashboardKey: null,
  config: {
    columns: []
  },
  isLoading: false,
  saveResult: {
    status: '',
    recordId: ''
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
        config: payload,
        isLoading: false
      };
    },
    [setDashboardKey]: (state, { payload }) => {
      return {
        ...state,
        dashboardKey: payload
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
