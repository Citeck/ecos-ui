import { handleActions } from 'redux-actions';
import {
  getDashboardConfig,
  resetDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setLoading,
  setRequestResultDashboard
} from '../actions/dashboard';
import { changeActiveTab } from '../actions/pageTabs';

const initialState = {
  isLoading: false,
  identification: {
    key: null,
    id: null,
    type: null,
    user: null
  },
  config: [],
  titleInfo: {
    modifierName: '',
    modifierUrl: '',
    modified: '',
    name: '',
    version: ''
  },
  requestResult: {
    status: '',
    dashboardId: ''
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [getDashboardConfig]: state => {
      return {
        ...state,
        isLoading: true
      };
    },
    [changeActiveTab]: state => {
      return {
        ...state,
        isLoading: true
      };
    },

    [setDashboardIdentification]: (state, { payload }) => {
      const { identification } = payload;

      return {
        ...state,
        identification
      };
    },
    [setDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        config: payload,
        isLoading: false
      };
    },
    [setRequestResultDashboard]: (state, { payload }) => {
      return {
        ...state,
        requestResult: payload,
        isLoading: false
      };
    },
    [setDashboardTitleInfo]: (state, { payload }) => {
      return {
        ...state,
        titleInfo: payload
      };
    },

    [resetDashboardConfig]: state => {
      return {
        ...initialState
      };
    },

    [setLoading]: (state, { payload }) => {
      return {
        ...state,
        isLoading: payload
      };
    }
  },
  initialState
);
