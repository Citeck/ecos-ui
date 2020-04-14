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
  const _args = action.payload._args;

  if (_args !== undefined) {
    action.payload = _args;
  }

  return action;
};

export function wrapArgs(id) {
  let stateId = id;
  return args => ({ _args: args, stateId });
}

export function* wrapSaga({ api, logger, saga }, action) {
  const stateId = action.payload.stateId;
  const w = wrapArgs(stateId);

  action = handleAction(action);

  yield saga({ api, logger, stateId, w }, action);
}

export function getCurrentStateById(state, stateId, initialState = {}) {
  const currentState = state[stateId] || {};

  return { ...initialState, ...currentState };
}

export function deleteStateById(state, stateId) {
  const { [stateId]: del, ...newState } = state;

  return newState;
}
