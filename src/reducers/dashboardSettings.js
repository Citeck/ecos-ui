import { handleActions } from 'redux-actions';
import {
  getAvailableWidgets,
  getAwayFromPage,
  getCheckUpdatedDashboardConfig,
  getDashboardConfig,
  getDashboardKeys,
  initDashboardSettings,
  saveDashboardConfig,
  setAvailableWidgets,
  setCheckUpdatedDashboardConfig,
  setDashboardConfig,
  setDashboardKeys,
  setRequestResultDashboard
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
  requestResult: {
    status: '',
    dashboardId: '',
    saveWay: ''
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
    [getCheckUpdatedDashboardConfig]: startLoading,

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
    [setRequestResultDashboard]: (state, { payload = {} }) => {
      return {
        ...state,
        requestResult: payload,
        isLoading: false
      };
    },
    [setCheckUpdatedDashboardConfig]: (state, { payload = {} }) => {
      return {
        ...state,
        requestResult: payload,
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
