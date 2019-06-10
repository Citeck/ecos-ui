import { handleActions } from 'redux-actions';
import { saveDashboardConfig, setDashboardConfig, setDashboardKey, setResultSaveDashboard } from '../actions/dashboard';
import { setLoading } from '../actions/loader';
import { setResultSaveUserMenu } from '../actions/menu';

const initialState = {
  dashboardKey: null,
  config: {
    columns: []
  },
  isLoading: false,
  saveDashboard: {
    status: '',
    recordId: ''
  },
  saveMenu: {
    status: ''
  }
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
    [setDashboardKey]: (state, { payload }) => {
      return {
        ...state,
        dashboardKey: payload
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
        config: payload || state.config
      };
    },
    [setResultSaveDashboard]: (state, { payload }) => {
      const { status, recordId } = payload;

      return {
        ...state,
        saveDashboard: {
          status,
          recordId
        }
      };
    },
    [setResultSaveUserMenu]: (state, { payload }) => {
      const { status } = payload;

      return {
        ...state,
        saveMenu: {
          status
        }
      };
    }
  },
  initialState
);
