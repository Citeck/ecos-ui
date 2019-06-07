import { handleActions } from 'redux-actions';
import { setDashboardConfig, saveDashboardConfig } from '../actions/dashboard';
import { setLoading } from '../actions/loader';
import { setDashboardKey } from '../actions/dashboardSettings';

const initialState = {
  dashboardKey: null,
  config: {
    columns: []
  },
  isLoading: false,
  saveStatus: ''
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
    [setLoading]: (state, { payload = false }) => {
      return {
        ...state,
        isLoading: payload
      };
    },
    [saveDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: payload || state.config,
        isLoading: false
      };
    }
  },
  initialState
);
