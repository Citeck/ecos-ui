import { handleActions } from 'redux-actions';

import { getBase64Barcode, init, setAllowedTypes, setBase64Barcode, setDisplayElements, setError } from '../actions/barcode';

const initialState = {
  error: '',
  barcode: '',
  isLoading: false,
  allowedTypes: [],
  displayElements: {
    btnGenerateNew: false
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
    [setDisplayElements]: (state, { payload: { stateId, displayElements } }) => ({
      ...state,
      [stateId]: {
        ...state[stateId],
        displayElements
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
