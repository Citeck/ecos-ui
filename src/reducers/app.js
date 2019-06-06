import { handleActions } from 'redux-actions';
import { initAppSuccess, initAppFailure, setMenuConfig } from '../actions/app';
import { MENU_TYPE } from '../constants/dashboardSettings';

const initialState = {
  isInit: false,
  isInitFailure: false,
  menu: {
    type: MENU_TYPE.LEFT,
    links: []
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [initAppSuccess]: (state, action) => {
      return {
        ...state,
        isInit: true
      };
    },
    [initAppFailure]: (state, action) => {
      return {
        ...state,
        isInit: true,
        isInitFailure: true
      };
    },
    [setMenuConfig]: (state, action) => {
      return {
        ...state,
        menu: action.payload
      };
    }
  },
  initialState
);
