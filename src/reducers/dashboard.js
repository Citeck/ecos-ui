import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  getDashboardConfig,
  resetAllDashboardsConfig,
  resetDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setLoading,
  setMobileDashboardConfig,
  setRequestResultDashboard,
  setWarningMessage
} from '../actions/dashboard';
import { getDashboardConfig as getOrgstructureDashboardConfig } from '../actions/orgstructure';
import { setUserData } from '../actions/user';

const initialState = {
  isLoading: false,
  identification: {
    key: null,
    id: null,
    type: null,
    user: null
  },
  originalConfig: {},
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
  reset: false,
  warningMessage: ''
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
    [getOrgstructureDashboardConfig]: (state, { payload }) => {
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
    [setDashboardIdentification]: (state, { payload: { identification, key } }) => {
      return {
        ...state,
        [key]: {
          ...state[key],
          identification
        }
      };
    },
    [setDashboardConfig]: (state, { payload: { key, config, originalConfig, modelAttributes } }) => {
      const { id: _id, key: _key } = state[key].identification || {};
      const boards = {};
      const keys = Object.keys(state);

      for (const k of keys) {
        const bState = state[k] || {};
        const identification = bState.identification || {};

        if (identification.id === _id && identification.key === _key) {
          boards[k] = { ...bState, config, isLoading: false };
        }
      }

      if (originalConfig) {
        boards[key].originalConfig = originalConfig;
      }

      if (modelAttributes) {
        boards[key].modelAttributes = modelAttributes;
      }

      return {
        ...state,
        ...boards
      };
    },
    [setMobileDashboardConfig]: (state, { payload }) => {
      const extra = {};

      if (payload.originalConfig) {
        extra.originalConfig = payload.originalConfig;
      }

      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          ...extra,
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

    [resetAllDashboardsConfig]: (state, { payload }) => {
      const newState = Object.keys(state)
        .filter(key => {
          return get(state, [key, 'identification', 'type']) === get(payload, 'type');
        })
        .reduce(
          (result, key) => ({
            ...result,
            [key]: { ...initialState }
          }),
          {}
        );

      return {
        ...state,
        ...newState
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
    },

    [setWarningMessage]: (state, { payload }) => {
      return {
        ...state,
        [payload.key]: {
          ...state[payload.key],
          warningMessage: payload.message
        }
      };
    },

    [setUserData]: (state, { payload }) => {
      // todo подумать, как получать key более универсально
      const key = payload.stateId.split(']-')[0].replace('[', '');
      return { ...state, [key]: { ...state[key], isLoading: false } };
    }
  },
  {}
);
