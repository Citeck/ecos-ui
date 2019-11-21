import { handleActions } from 'redux-actions';
import { getGeneratedBarcode, setGeneratedBarcode, setError, getBase64Barcode, setBase64Barcode } from '../actions/barcode';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  barcode: '',
  error: ''
};

const startLoading = (state, { payload: { stateId } }) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateById(state, stateId, initialState),
    isLoading: true,
    barcode: '',
    error: ''
  }
});

export default handleActions(
  {
    [getGeneratedBarcode]: startLoading,
    [setGeneratedBarcode]: (state, { payload: { stateId, barcode, error } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        barcode,
        error,
        isLoading: false
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
