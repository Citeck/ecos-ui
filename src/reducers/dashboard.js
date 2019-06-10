import { handleActions } from 'redux-actions';
import { saveDashboardConfig, setDashboardConfig, setDashboardKey, setResultSaveDashboard } from '../actions/dashboard';
import { setLoading } from '../actions/loader';

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

export default handleActions(
  {
    [setDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: payload
      };
    },
    [setDashboardKey]: (state, { payload }) => {
      return {
        ...state,
        dashboardKey: payload
      };
    },
    [saveDashboardConfig]: (state, { payload }) => {
      return {
        ...state
      };
    },
    [setResultSaveDashboard]: (state, { payload }) => {
      return {
        ...state,
        saveResult: payload
      };
    },
    [setLoading]: (state, { payload = false }) => {
      return {
        ...state,
        isLoading: payload
      };
    }
  },
  initialState
);
