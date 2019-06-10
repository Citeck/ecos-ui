import { handleActions } from 'redux-actions';
import { setAllMenuItems, setResultSaveUserMenu, setUserMenuConfig } from '../actions/menu';
import { MENU_TYPE } from '../constants';
import { setLoading } from '../actions/loader';

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

export default handleActions(
  {
    [setUserMenuConfig]: (state, action) => {
      return {
        ...state,
        ...action.payload
      };
    },
    [setResultSaveUserMenu]: (state, { payload }) => {
      const { status } = payload;

      return {
        ...state,
        saveResult: {
          status
        }
      };
    },
    [setAllMenuItems]: (state, { payload }) => {
      return {
        ...state,
        menuItems: payload
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
