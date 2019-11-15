import { createAction } from 'redux-actions';

const prefix = 'barcode/';

export const getGeneratedBarcode = createAction(prefix + 'GET_GENERATED_BARCODE');
export const setGeneratedBarcode = createAction(prefix + 'SET_GENERATED_BARCODE');

export const printBarcode = createAction(prefix + 'PRINT_BARCODE');
