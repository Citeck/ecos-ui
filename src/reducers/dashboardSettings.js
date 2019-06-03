import { handleActions } from 'redux-actions';
import {
  setConfigPage,
  setMenuItems,
  setWidgets,
  setStatusSaveConfigPage,
  saveConfigPage,
  initSettings,
  stopLoading
} from '../actions/dashboardSettings';
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
    [initSettings]: state => {
      return {
        ...state,
        isLoading: true
      };
    },
    [setConfigPage]: (state, action) => {
      return {
        ...state,
        config: action.payload
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
    [saveConfigPage]: (state, action) => {
      return {
        ...state,
        isLoading: true
      };
    },
    [setStatusSaveConfigPage]: (state, { payload = {} }) => {
      const { saveStatus } = payload;

      return {
        ...state,
        isLoading: false,
        saveStatus
      };
    },
    [stopLoading]: state => {
      return {
        ...state,
        isLoading: false
      };
    }
  },
  initialState
);
