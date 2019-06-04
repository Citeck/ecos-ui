import { handleActions } from 'redux-actions';
import { saveDashboardConfig, setDashboardConfig, setMenuItems, setStatusSaveConfigPage, setWidgets } from '../actions/dashboardSettings';
import { setLoading } from '../actions/loader';
import { LAYOUT_TYPE, MENU_TYPE } from '../constants/dashboardSettings';

const initialState = {
  config: {
    layoutType: LAYOUT_TYPE.TWO_COLUMNS_BS,
    menuType: MENU_TYPE.LEFT,
    widgets: [],
    menu: []
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
    [setWidgets]: (state, action) => {
      return {
        ...state,
        widgets: action.payload
      };
    },
    [setMenuItems]: (state, action) => {
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
