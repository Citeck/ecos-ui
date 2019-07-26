import { handleActions } from 'redux-actions';
import {
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setResultSaveDashboardConfig,
  resetDashboardConfig
} from '../actions/dashboard';
import { changeActiveTab } from '../actions/pageTabs';

const initialState = {
  identification: {
    key: null,
    id: null,
    type: null
  },
  config: {
    columns: [],
    type: ''
  },
  titleInfo: {
    modifierName: '',
    modifierUrl: '',
    modified: '',
    name: '',
    version: ''
  },
  isLoading: false,
  saveResult: {
    status: '',
    dashboardId: ''
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [setDashboardIdentification]: (state, { payload }) => {
      const { identification } = payload;

      return {
        ...state,
        identification
      };
    },
    [setDashboardConfig]: (state, { payload }) => {
      const { ...config } = payload;

      return {
        ...state,
        config,
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
    [changeActiveTab]: state => {
      return {
        ...state,
        ...initialState,
        isLoading: true
      };
    },
    [setDashboardTitleInfo]: (state, { payload }) => {
      return {
        ...state,
        ...initialState,
        titleInfo: payload
      };
    },
    [resetDashboardConfig]: state => {
      return {
        ...state,
        ...initialState
      };
    }
  },
  initialState
);
