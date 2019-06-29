import { handleActions } from 'redux-actions';
import {
  getAvailableWidgets,
  getDashboardConfig,
  initDashboardSettings,
  setAvailableWidgets,
  setDashboardConfig,
  setResultSaveDashboardConfig,
  saveDashboardConfig,
  getAwayFromPage
} from '../actions/dashboardSettings';
import { LAYOUT_TYPE } from '../constants/layout';

const initialState = {
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
      return {
        ...state,
        config: payload,
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
