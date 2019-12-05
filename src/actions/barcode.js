import { createAction } from 'redux-actions';

const prefix = 'barcode/';

export const getBase64Barcode = createAction(prefix + 'GET_BASE64_BARCODE');
export const setBase64Barcode = createAction(prefix + 'SET_BASE64_BARCODE');

export const setError = createAction(prefix + 'SET_ERROR');
