import { createAction } from 'redux-actions';

const prefix = 'barcode/';

export const init = createAction(prefix + 'INIT');

export const setDisplayElements = createAction(prefix + 'SET_DISPLAY_ELMs');
export const setAllowedTypes = createAction(prefix + 'SET_ALLOWED_TYPES');

export const getBase64Barcode = createAction(prefix + 'GET_BASE64_BARCODE');
export const setBase64Barcode = createAction(prefix + 'SET_BASE64_BARCODE');

export const setError = createAction(prefix + 'SET_ERROR');
