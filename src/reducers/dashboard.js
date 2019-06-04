import { handleActions } from 'redux-actions';
import { getDashboardConfig, setDashboardConfig, saveDashboardConfig } from '../actions/dashboard';
import { MENU_TYPE } from '../constants/dashboardSettings';

const initialState = {
  config: {
    menu: {
      type: MENU_TYPE.LEFT,
      links: []
    },
    columns: []
  },
  isLoading: false,
  saveStatus: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [getDashboardConfig]: (state, action) => {
      return {
        ...state,
        isLoading: true
      };
    },
    [setDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: payload || state.config,
        isLoading: false
      };
    },
    [saveDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: payload || state.config,
        isLoading: false
      };
    }
  },
  initialState
);
