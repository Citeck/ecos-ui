import { handleActions } from 'redux-actions';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig, setResultSaveDashboardConfig } from '../actions/dashboard';

const initialState = {
  identification: {
    key: null,
    id: null,
    type: null
  },
  config: {
    columns: [],
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
      const { identification, ...config } = payload;

      return {
        ...state,
        config,
        identification,
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
