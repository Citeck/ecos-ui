import get from 'lodash/get';

import { getWorkspaceId } from './urls';
import { getEnabledWorkspaces } from './util';

export const getTitleFormatter = module => {
  return (action, time, took) => `${module} >>> action @ ${action.type}`;
};

export const handleState = (state, stateId, payload) =>
  stateId
    ? {
        ...state,
        [stateId]: {
          ...state[stateId],
          ...payload
        }
      }
    : {
        ...state,
        ...payload
      };

export const handleAction = action => {
  const _args = get(action, 'payload._args');

  if (_args !== undefined) {
    action.payload = _args;
  }

  return action;
};

export function wrapArgs(stateId) {
  return _args => ({ _args, stateId });
}

export function* wrapSaga({ api, saga }, action) {
  const stateId = get(action, 'payload.stateId');
  const w = wrapArgs(stateId);

  action = handleAction(action);

  yield saga({ api, stateId, w }, action);
}

export function getStateId({ tabId = '', id = '' }) {
  const baseId = `[${tabId}]-[${id}]`;

  if (getEnabledWorkspaces()) {
    return baseId + `-[${getWorkspaceId()}]`;
  }

  return baseId;
}

export function getCurrentStateById(state, stateId, initialState = {}) {
  const currentState = state[stateId] || {};

  return { ...initialState, ...currentState };
}

export function deleteStateById(state, stateId) {
  const { [stateId]: del, ...newState } = state;

  return newState;
}

export function startLoading(initialState, keyLoader = 'isLoading') {
  return function (state, action = {}) {
    const stateId = get(action, 'payload.stateId');

    if (stateId) {
      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          [keyLoader]: true
        }
      };
    }

    return state;
  };
}

export const updateState = (state = {}, stateId, newData = {}, initialState) => {
  return {
    ...state,
    [stateId]: {
      ...getCurrentStateById(state, stateId, initialState),
      ...newData
    }
  };
};
