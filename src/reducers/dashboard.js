import { handleActions } from 'redux-actions';
import {
  getDashboardConfig,
  resetDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setLoading,
  setResultSaveDashboardConfig
} from '../actions/dashboard';
import { changeActiveTab } from '../actions/pageTabs';

const initialState = {
  isLoading: false,
  identification: {
    key: null,
    id: null,
    type: null
  },
  config: [],
  titleInfo: {
    modifierName: '',
    modifierUrl: '',
    modified: '',
    name: '',
    version: ''
  },
  saveResult: {
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
    [setResultSaveDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        saveResult: payload,
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
