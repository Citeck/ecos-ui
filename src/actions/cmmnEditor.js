import { createAction } from 'redux-actions';

const prefix = 'cmmn-editor/';

export const initData = createAction(prefix + 'INIT_DATA');
export const getTitle = createAction(prefix + 'GET_TITLE');
export const setTitle = createAction(prefix + 'SET_TITLE');
export const getDiagram = createAction(prefix + 'GET_DIAGRAM');
export const setDiagram = createAction(prefix + 'SET_DIAGRAM');
export const saveDiagram = createAction(prefix + 'SAVE_DIAGRAM');
