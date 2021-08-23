import { createAction } from 'redux-actions';

const prefix = 'kanban/';

export const getBoardList = createAction(prefix + 'GET_BOARD_LIST');
export const setBoardList = createAction(prefix + 'SET_BOARD_LIST');
export const setIsEnabled = createAction(prefix + 'SET_IS_ENABLED');

export const getBoardData = createAction(prefix + 'GET_BOARD_DATA');
export const getBoardConfig = createAction(prefix + 'GET_BOARD_CONFIG');
export const setBoardConfig = createAction(prefix + 'SET_BOARD_CONFIG');
export const setFormProps = createAction(prefix + 'SET_FORM_PROPS');
export const setDataCards = createAction(prefix + 'SET_DATA_CARDS');
export const setTotalCount = createAction(prefix + 'SET_TOTAL_COUNT');
export const getNextPage = createAction(prefix + 'GET_NEXT_BOARD_PAGE');

export const selectBoardId = createAction(prefix + 'SELECT_BOARD_ID');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const setPagination = createAction(prefix + 'SET_PAGINATION');
