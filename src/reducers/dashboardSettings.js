import { handleActions } from 'redux-actions';
import {
  getAvailableWidgets,
  getAwayFromPage,
  getDashboardConfig,
  getDashboardKeys,
  initDashboardSettings,
  saveDashboardConfig,
  setAvailableWidgets,
  setDashboardConfig,
  setDashboardKeys,
  setResultSaveDashboardConfig
} from '../actions/dashboardSettings';

const initialState = {
  identification: {
    key: null,
    id: null,
    type: null
  },
  config: [],
  availableWidgets: [],
  dashboardKeys: [],
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
    [initDashboardSettings]: startLoading,
    [getDashboardConfig]: startLoading,
    [getAvailableWidgets]: startLoading,
    [getDashboardKeys]: startLoading,
    [saveDashboardConfig]: startLoading,

    [setDashboardConfig]: (state, { payload }) => {
      const { identification, config } = payload;

      return {
        ...state,
        config,
        identification,
        isLoading: false
      };
    },
    [setAvailableWidgets]: (state, { payload }) => {
      return {
        ...state,
        availableWidgets: payload,
        isLoading: false
      };
    },
    [setDashboardKeys]: (state, { payload }) => {
      return {
        ...state,
        dashboardKeys: payload,
        isLoading: false
      };
    },
    [setResultSaveDashboardConfig]: (state, { payload = {} }) => {
      return {
        ...state,
        saveResult: payload,
        isLoading: false
      };
    },
    [getAwayFromPage]: (state, { payload = {} }) => {
      return {
        ...state,
        ...initialState
      };
    }
  },
  initialState
);
