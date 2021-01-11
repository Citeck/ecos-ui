import { createAction } from 'redux-actions';

const prefix = 'model-editor/';

export const getTitle = createAction(prefix + 'GET_TITLE');
export const setTitle = createAction(prefix + 'SET_TITLE');
