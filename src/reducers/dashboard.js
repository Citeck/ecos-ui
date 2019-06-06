import { handleActions } from 'redux-actions';
import { setDashboardConfig, saveDashboardConfig } from '../actions/dashboard';
import { setLoading } from '../actions/loader';

const initialState = {
  config: {
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
