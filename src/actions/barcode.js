import { createAction } from 'redux-actions';

const prefix = 'barcode/';

export const getBarcode = createAction(prefix + 'GET_BARCODE');

export const setBarcode = createAction(prefix + 'SET_BARCODE');
