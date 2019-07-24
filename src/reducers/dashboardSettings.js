import { handleActions } from 'redux-actions';
import {
  getAvailableWidgets,
  getAwayFromPage,
  getDashboardConfig,
  initDashboardSettings,
  saveDashboardConfig,
  setAvailableWidgets,
  setDashboardConfig,
  setResultSaveDashboardConfig
} from '../actions/dashboardSettings';
import { LAYOUT_TYPE } from '../constants/layout';

const initialState = {
  identification: {
    key: null,
    id: null,
    type: null
  },
  config: {
    layoutType: LAYOUT_TYPE.TWO_COLUMNS_BS,
    widgets: []
  },
  availableWidgets: [],
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
    [setAvailableWidgets]: (state, { payload }) => {
      return {
        ...state,
        availableWidgets: payload,
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
