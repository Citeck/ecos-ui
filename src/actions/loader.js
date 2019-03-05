import { createAction } from 'redux-actions';

const prefix = 'loader/';

export const setLoading = createAction(prefix + 'SET_LOADING');
