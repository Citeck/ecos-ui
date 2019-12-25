import { handleActions } from 'redux-actions';

import { init, getDocumentTypes, setDocumentTypes } from '../actions/documents';

export const initialState = {
  types: [],
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [init]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload]) {
        ownState = { ...ownState, ...state[payload] };
      }

      return {
        ...state,
        [payload]: { ...ownState }
      };
    },
    [getDocumentTypes]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: true
      }
    }),
    [setDocumentTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        types: payload.types,
        isLoading: false
      }
    })
  },
  {}
);
