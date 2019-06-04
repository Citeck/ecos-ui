import { handleActions } from 'redux-actions';
import { setDashboardConfig, saveDashboardConfig } from '../actions/dashboard';
import { MENU_TYPE } from '../constants/dashboardSettings';
import { setLoading } from '../actions/loader';

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
    [setDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: payload
      };
    },
    [setLoading]: (state, { payload = false }) => {
      return {
        ...state,
        isLoading: payload
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
