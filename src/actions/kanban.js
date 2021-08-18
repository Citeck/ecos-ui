import { createAction } from 'redux-actions';

const prefix = 'kanban/';

export const getBoardList = createAction(prefix + 'GET_BOARD_LIST');
export const setBoardList = createAction(prefix + 'SET_BOARD_LIST');
export const setIsEnabled = createAction(prefix + 'SET_IS_ENABLED');

export const getBoardConfig = createAction(prefix + 'GET_BOARD_CONFIG');
export const setBoardConfig = createAction(prefix + 'SET_BOARD_CONFIG');
