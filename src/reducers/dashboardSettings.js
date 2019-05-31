import { handleActions } from 'redux-actions';
import { setConfigPage, setMenuItems, setWidgets, setStatusSaveConfigPage } from '../actions/dashboardSettings';

const initialState = {
  config: {},
  widgets: [],
  menuItems: []
};

Object.freeze(initialState);

export default handleActions(
  {
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
    [setStatusSaveConfigPage]: (state, action) => {
      return {
        ...state
      };
    }
  },
  initialState
);
