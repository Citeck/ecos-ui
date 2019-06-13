import { handleActions } from 'redux-actions';
import {
  getAvailableWidgets,
  getDashboardConfig,
  initDashboardSettings,
  setAvailableWidgets,
  setDashboardConfig,
  setDashboardKey,
  setResultSaveDashboardConfig,
  saveDashboardConfig
} from '../actions/dashboardSettings';
import { LAYOUT_TYPE } from '../constants/dashboardSettings';

const initialState = {
  dashboardKey: null,
  config: {
    layoutType: LAYOUT_TYPE.TWO_COLUMNS_BS,
    widgets: []
  },
  availableWidgets: [],
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
    [setDashboardKey]: (state, { payload }) => {
      return {
        ...state,
        dashboardKey: payload
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
    }
  },
  initialState
);
