import { handleActions } from 'redux-actions';

import { init, setAllowedTypes, getBase64Barcode, setBase64Barcode, setError } from '../actions/barcode';
import { defaultSettings } from '../constants/barcode';

const initialState = {
  error: '',
  barcode: '',
  isLoading: false,
  allowedTypes: [],
  config: {
    settings: { ...defaultSettings }
  }
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
    [setAllowedTypes]: (state, { payload: { stateId, allowedTypes } }) => ({
      ...state,
      [stateId]: {
        ...state[stateId],
        allowedTypes
      }
    }),
    [setError]: (state, { payload: { stateId, error } }) => ({
      ...state,
      [stateId]: {
        ...state[stateId],
        error,
        barcode: '',
        isLoading: false
      }
    }),
    [getBase64Barcode]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...state[stateId],
        error: '',
        barcode: '',
        isLoading: true
      }
    }),
    [setBase64Barcode]: (state, { payload: { stateId, barcode } }) => ({
      ...state,
      [stateId]: {
        ...state[stateId],
        error: '',
        barcode,
        isLoading: false
      }
    })
  },
  {}
);
