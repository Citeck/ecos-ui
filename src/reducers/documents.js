import { handleActions } from 'redux-actions';

import { init, initSuccessful, getAvailableTypes, setAvailableTypes, setDynamicTypes, setDocuments } from '../actions/documents';

export const initialState = {
  types: [],
  availableTypes: [],
  dynamicTypes: [],
  documents: [],
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [init]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.record]) {
        ownState = { ...ownState, ...state[payload.record] };
      }

      return {
        ...state,
        [payload.record]: {
          ...ownState,
          isLoading: true
        }
      };
    },
    [initSuccessful]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: false
      }
    }),

    [getAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: true
      }
    }),
    [setAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        availableTypes: payload.types,
        isLoading: false
      }
    }),

    [setDynamicTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        dynamicTypes: payload.dynamicTypes
      }
    }),

    [setDocuments]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        documents: payload.documents
      }
    })
  },
  {}
);
