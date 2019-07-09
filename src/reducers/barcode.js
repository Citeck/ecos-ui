import { handleActions } from 'redux-actions';
import { getBarcode, setBarcode } from '../actions/barcode';
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
    [getBarcode]: startLoading,
    [setBarcode]: (state, { payload: { stateId, barcode, error } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        barcode,
        error,
        isLoading: false
      }
    })
  },
  {}
);
