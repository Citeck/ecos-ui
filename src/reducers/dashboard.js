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

export { initialState };

export default handleActions(
  {
    [getDashboardConfig]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.key]) {
        ownState = { ...ownState, ...state[payload.key] };
      }

      return {
        ...state,
        [payload.key]: {
          ...ownState,
          reset: false,
          isLoading: true
        }
      };
    },
    [setDashboardIdentification]: (state, { payload }) => {
      const { identification, key } = payload;

      return {
        ...state,
        [key]: {
          ...state[key],
          identification
        }
      };
    },
    [setDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          config: payload.config,
          isLoading: false
        }
      };
    },
    [setMobileDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          mobileConfig: payload.config,
          isLoading: false
        }
      };
    },
    [setRequestResultDashboard]: (state, { payload }) => {
      const { key, ...result } = payload;

      return {
        ...state,
        [key]: {
          ...state[key],
          requestResult: result,
          isLoading: false
        }
      };
    },
    [setDashboardTitleInfo]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          titleInfo: payload.titleInfo
        }
      };
    },

    [resetDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        [payload]: {
          ...initialState,
          reset: true
        }
      };
    },

    [setLoading]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          isLoading: payload.status
        }
      };
    }
  },
  {}
);
