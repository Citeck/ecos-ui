import { createAction } from 'redux-actions';

const prefix = 'kanban/';

export const getBoardList = createAction(prefix + 'GET_BOARD_LIST');
export const setBoardList = createAction(prefix + 'SET_BOARD_LIST');
export const setIsEnabled = createAction(prefix + 'SET_IS_ENABLED');

export const getBoardData = createAction(prefix + 'GET_BOARD_DATA');
export const getBoardConfig = createAction(prefix + 'GET_BOARD_CONFIG');
export const setBoardConfig = createAction(prefix + 'SET_BOARD_CONFIG');
export const setOriginKanbanSettings = createAction(prefix + 'SET_ORIGIN_KANBAN_SETTINGS');
export const setKanbanSettings = createAction(prefix + 'SET_KANBAN_SETTINGS');
export const setFormProps = createAction(prefix + 'SET_FORM_PROPS');
export const setDataCards = createAction(prefix + 'SET_DATA_CARDS');
export const setTotalCount = createAction(prefix + 'SET_TOTAL_COUNT');
export const getNextPage = createAction(prefix + 'GET_NEXT_BOARD_PAGE');
export const setResolvedActions = createAction(prefix + 'SET_RESOLVED_ACTIONS');
export const runAction = createAction(prefix + 'RUN_ACTION');
export const moveCard = createAction(prefix + 'MOVE_CARD');
export const applyFilter = createAction(prefix + 'APPLY_FILTER');
export const applyPreset = createAction(prefix + 'APPLY_PRESET');
export const clearFiltered = createAction(prefix + 'CLEAR_FILTERED');
export const resetFilter = createAction(prefix + 'RESET_FILTER');
export const runSearchCard = createAction(prefix + 'RUN_SEARCH_CARD');
export const reloadBoardData = createAction(prefix + 'RELOAD_BOARD_DATA');

export const selectBoardId = createAction(prefix + 'SELECT_BOARD_ID');
export const selectTemplateId = createAction(prefix + 'SELECT_TEMPLATE_ID');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const setLoadingColumns = createAction(prefix + 'SET_LOADING_COLUMNS');
export const setIsFiltered = createAction(prefix + 'SET_IS_FILTERED');
export const setPagination = createAction(prefix + 'SET_PAGINATION');

export const setDefaultBoardAndTemplate = createAction(prefix + 'SET_DEFAULT_BOARD_AND_TEMPLATE');

export const cancelGetNextBoardPage = createAction(prefix + 'CANCEL_GET_NEXT_BOARD_PAGE');
