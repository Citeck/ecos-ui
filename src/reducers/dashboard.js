import { handleActions } from 'redux-actions';
import {
  getDashboardConfig,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setResultSaveDashboardConfig
} from '../actions/dashboard';
import { changeActiveTab } from '../actions/pageTabs';

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
    // [getDashboardConfig]: startLoading,
    // [saveDashboardConfig]: startLoading,

    [setDashboardIdentification]: (state, { payload }) => {
      const { identification } = payload;

      return {
        ...state,
        identification
      };
    },
    [setDashboardConfig]: (state, { payload }) => {
      const { ...config } = payload;

      return {
        ...state,
        config,
        isLoading: false
      };
    },
    [setResultSaveDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        saveResult: payload,
        isLoading: false
      };
    },
    [changeActiveTab]: state => {
      return {
        ...state,
        ...initialState,
        isLoading: true
      };
    }
  },
  initialState
);
