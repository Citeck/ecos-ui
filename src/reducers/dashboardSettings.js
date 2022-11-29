import { handleActions } from 'redux-actions';
import {
  getAvailableWidgets,
  getCheckUpdatedDashboardConfig,
  getDashboardConfig,
  getDashboardKeys,
  initDashboardSettings,
  resetConfigToDefault,
  resetDashboardConfig,
  saveDashboardConfig,
  setAvailableWidgets,
  setCheckUpdatedDashboardConfig,
  setDashboardConfig,
  setDashboardKeys,
  setLoading,
  setLoadingKeys,
  setRequestResultDashboard,
  setDashboardData,
  setDashboardSettings
} from '../actions/dashboardSettings';

export const initialState = {
  identification: {
    key: null,
    id: null,
    type: null
  },
  config: [],
  originalConfig: [],
  availableWidgets: [],
  dashboardKeys: [],
  isLoading: false,
  isLoadingKeys: false,
  requestResult: {
    status: '',
    dashboardId: '',
    saveWay: ''
  },
  recordRef: ''
};

Object.freeze(initialState);

const startLoading = (state, { payload }) => ({
  ...state,
  [payload.key]: {
    ...state[payload.key],
    isLoading: true
  }
});

export default handleActions(
  {
    [initDashboardSettings]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.key]) {
        ownState = { ...ownState, ...state[payload.key] };
      }

      return {
        ...state,
        ...startLoading(state, { payload }),
        [payload.key]: { ...ownState }
      };
    },
    [getDashboardConfig]: startLoading,
    [getAvailableWidgets]: startLoading,
    [getDashboardKeys]: startLoading,
    [saveDashboardConfig]: startLoading,
    [getCheckUpdatedDashboardConfig]: startLoading,
    [resetConfigToDefault]: startLoading,

    [setDashboardConfig]: (state, { payload }) => {
      const { identification, config, key, originalConfig, modelAttributes } = payload;
      return {
        ...state,
        [key]: {
          ...state[key],
          config,
          originalConfig,
          identification,
          modelAttributes,
          isLoading: false
        }
      };
    },
    [setDashboardSettings]: (state, { payload }) => {
      const { identification, config, key, originalConfig, modelAttributes } = payload;
      return {
        ...state,
        [key]: {
          ...state[key],
          config,
          originalConfig,
          identification,
          modelAttributes,
          isLoading: false
        }
      };
    },
    [setAvailableWidgets]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          availableWidgets: payload.widgets,
          isLoading: false
        }
      };
    },
    [setDashboardKeys]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          dashboardKeys: payload.keys,
          isLoading: false
        }
      };
    },
    [setRequestResultDashboard]: (state, { payload = {} }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          requestResult: payload.request,
          isLoading: false
        }
      };
    },
    [setCheckUpdatedDashboardConfig]: (state, { payload = {} }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          requestResult: payload,
          isLoading: false
        }
      };
    },

    [resetDashboardConfig]: (state, { payload }) => {
      return {
        ...state,
        [payload]: {
          ...initialState
        }
      };
    },
    [setLoading]: (state, { payload }) => {
      const { key } = payload;

      return {
        ...state,
        [key]: {
          ...state[key],
          isLoading: payload.status
        }
      };
    },
    [setLoadingKeys]: (state, { payload }) => {
      const { key } = payload;

      return {
        ...state,
        [key]: {
          ...state[key],
          isLoadingKeys: payload.status
        }
      };
    },
    [setDashboardData]: (state, { payload }) => {
      const { key, ...data } = payload;

      return {
        ...state,
        [key]: {
          ...state[key],
          ...data
        }
      };
    }
  },
  {}
);
