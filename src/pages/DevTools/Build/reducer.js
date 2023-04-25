import {
  SET_ALFRESCO_MODULES_ITEMS,
  SET_ALFRESCO_MODULES_ERROR,
  SET_SYSTEM_MODULES_ITEMS,
  SET_SYSTEM_MODULES_ERROR,
  SET_ALFRESCO_ENABLED
} from './actions';

export const initialState = {
  alfresco: {
    enabled: false,
    isReady: false,
    error: null,
    items: []
  },
  system: {
    isReady: false,
    error: null,
    items: []
  }
};

export function reducer(state, { type, payload }) {
  switch (type) {
    case SET_ALFRESCO_ENABLED:
      return {
        ...state,
        alfresco: {
          ...state.alfresco,
          enabled: payload
        }
      };
    case SET_ALFRESCO_MODULES_ITEMS:
      return {
        ...state,
        alfresco: {
          ...state.alfresco,
          isReady: true,
          error: null,
          items: payload
        }
      };
    case SET_ALFRESCO_MODULES_ERROR:
      return {
        ...state,
        alfresco: {
          ...state.alfresco,
          isReady: true,
          error: payload
        }
      };
    case SET_SYSTEM_MODULES_ITEMS:
      return {
        ...state,
        system: {
          ...state.system,
          isReady: true,
          error: null,
          items: payload
        }
      };
    case SET_SYSTEM_MODULES_ERROR:
      return {
        ...state,
        system: {
          ...state.system,
          isReady: true,
          error: payload
        }
      };
    default:
      throw new Error('[DevTools Build reducer] Unknown action type');
  }
}
