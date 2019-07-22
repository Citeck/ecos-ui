import { handleActions } from 'redux-actions';
import { setDashboardConfig, setDashboardIdentification, setDashboardTitleInfo, setResultSaveDashboardConfig } from '../actions/dashboard';
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
    modifier: '',
    modified: '',
    displayName: '',
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
    }
  },
  initialState
);
