import { handleActions } from 'redux-actions';

import { getDocumentTypes } from '../actions/documents';

export const initialState = {
  types: [],
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [getDocumentTypes]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: true
      }
    })
  },
  {}
);
