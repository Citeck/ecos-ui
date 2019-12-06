import { handleActions } from 'redux-actions';
import { getBase64Barcode, setBase64Barcode, setError } from '../actions/barcode';

export default handleActions(
  {
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
