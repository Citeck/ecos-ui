import { handleActions } from 'redux-actions';
import {
  getDashboardConfig,
  resetDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setLoading,
  setMobileDashboardConfig,
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
  mobileConfig: [],
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
  },
  reset: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [getDashboardConfig]: state => {
      return {
        ...state,
        reset: false,
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
    [setMobileDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        mobileConfig: payload,
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
        ...initialState,
        reset: true
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
