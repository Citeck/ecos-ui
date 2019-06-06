import { handleActions } from 'redux-actions';
import {
  saveDashboardConfig,
  setDashboardConfig,
  setAllMenuItems,
  setStatusSaveConfigPage,
  setAllWidgets
} from '../actions/dashboardSettings';
import { setLoading } from '../actions/loader';
import { LAYOUT_TYPE } from '../constants/dashboardSettings';

const initialState = {
  config: {
    layoutType: LAYOUT_TYPE.TWO_COLUMNS_BS,
    widgets: []
  },
  widgets: [],
  menuItems: [],
  isLoading: false,
  saveStatus: ''
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
    [saveDashboardConfig]: (state, action) => {
      return {
        ...state
      };
    },
    [setStatusSaveConfigPage]: (state, { payload = {} }) => {
      const { saveStatus } = payload;

      return {
        ...state,
        saveStatus
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
