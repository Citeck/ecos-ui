import { handleActions } from 'redux-actions';
import {
  saveSettings,
  setAllMenuItems,
  setAllWidgets,
  setDashboardKey,
  setDashboardConfig,
  setResultSaveSettings
} from '../actions/dashboardSettings';
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
  saveInfo: {
    dashboardStatus: '',
    menuStatus: '',
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
    [setAllWidgets]: (state, action) => {
      return {
        ...state,
        widgets: action.payload
      };
    },
    [setAllMenuItems]: (state, action) => {
      return {
        ...state,
        menuItems: action.payload
      };
    },
    [saveSettings]: (state, action) => {
      return {
        ...state
      };
    },
    [setResultSaveSettings]: (state, { payload = {} }) => {
      const { dashboardStatus, menuStatus, recordId } = payload;

      return {
        ...state,
        saveInfo: {
          dashboardStatus,
          menuStatus,
          recordId
        }
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
