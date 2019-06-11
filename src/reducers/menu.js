import { handleActions } from 'redux-actions';
import {
  getAllMenuItems,
  getUserMenuConfig,
  initMenuSettings,
  saveUserMenuConfig,
  setAllMenuItems,
  setResultSaveUserMenu,
  setUserMenuConfig
} from '../actions/menu';
import { MENU_TYPE } from '../constants';

const initialState = {
  user: {
    type: MENU_TYPE.LEFT,
    links: []
  },
  menuItems: [],
  isLoading: false,
  saveResult: {
    status: ''
  }
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [initMenuSettings]: startLoading,
    [getAllMenuItems]: startLoading,
    [getUserMenuConfig]: startLoading,
    [saveUserMenuConfig]: startLoading,

    [setUserMenuConfig]: (state, action) => {
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        },
        isLoading: false
      };
    },
    [setResultSaveUserMenu]: (state, { payload }) => {
      const { status } = payload;

      return {
        ...state,
        saveResult: {
          status
        },
        isLoading: false
      };
    },
    [setAllMenuItems]: (state, { payload }) => {
      return {
        ...state,
        menuItems: payload,
        isLoading: false
      };
    }
  },
  initialState
);
