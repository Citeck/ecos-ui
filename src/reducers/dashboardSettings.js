import { handleActions } from 'redux-actions';
import {
  getAllWidgets,
  getDashboardConfig,
  initDashboardSettings,
  setAllWidgets,
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
  widgets: [],
  menuItems: [],
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
    [getAllWidgets]: startLoading,
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
    [setAllWidgets]: (state, { payload }) => {
      return {
        ...state,
        widgets: payload,
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
