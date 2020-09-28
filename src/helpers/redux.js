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
  const { _args } = action.payload || {};

  if (_args !== undefined) {
    action.payload = _args;
  }

  return action;
};

export function wrapArgs(stateId) {
  return _args => ({ _args, stateId });
}

export function* wrapSaga({ api, logger, saga }, action) {
  const stateId = action.payload.stateId;
  const w = wrapArgs(stateId);

  action = handleAction(action);

  yield saga({ api, logger, stateId, w }, action);
}

export function getStateId({ tabId = '', id = '' }) {
  return `[${tabId}]-[${id}]`;
}

export function getCurrentStateById(state, stateId, initialState = {}) {
  const currentState = state[stateId] || {};

  return { ...initialState, ...currentState };
}

export function deleteStateById(state, stateId) {
  const { [stateId]: del, ...newState } = state;

  return newState;
}

export function startLoading(initialState) {
  return function(state, { payload: { stateId } }) {
    return {
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        isLoading: true
      }
    };
  };
}

export const updateState = (state, stateId, newData = {}, initialState) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateById(state, stateId, initialState),
    ...newData
  }
});
