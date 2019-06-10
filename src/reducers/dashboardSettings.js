import { handleActions } from 'redux-actions';
import {
  saveDashboardConfig,
  setAllWidgets,
  setDashboardConfig,
  setDashboardKey,
  setResultSaveDashboardConfig
} from '../actions/dashboardSettings';
import { setAllMenuItems } from '../actions/menu';
import { setLoading } from '../actions/loader';
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
    [setAllWidgets]: (state, { payload }) => {
      return {
        ...state,
        widgets: payload
      };
    },
    [setAllMenuItems]: (state, { payload }) => {
      return {
        ...state,
        menuItems: payload
      };
    },
    [saveDashboardConfig]: (state, { payload }) => {
      return {
        ...state
      };
    },
    [setResultSaveDashboardConfig]: (state, { payload = {} }) => {
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
