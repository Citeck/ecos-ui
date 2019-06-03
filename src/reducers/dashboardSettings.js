import { handleActions } from 'redux-actions';
import { setConfigPage, setMenuItems, setWidgets, setStatusSaveConfigPage, saveConfigPage } from '../actions/dashboardSettings';

const initialState = {
  config: {},
  widgets: [],
  menuItems: [],
  isLoading: false,
  saveStatus: ''
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
    }
  },
  initialState
);
