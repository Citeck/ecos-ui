import { createAction } from 'redux-actions';

const prefix = 'properties/';

export const getFormList = createAction(prefix + 'GET_FORM_LIST');
export const setFormList = createAction(prefix + 'SET_FORM_LIST');
export const resetData = createAction(prefix + 'RESET_DATA');
