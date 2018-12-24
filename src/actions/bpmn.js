import { createAction } from 'redux-actions';

const prefix = 'bpmn/';

export const setViewType = createAction(prefix + 'SET_VIEW_TYPE');
export const setActiveSortFilter = createAction(prefix + 'SET_ACTIVE_SORT_FILTER');
export const setSearchText = createAction(prefix + 'SET_SEARCH_TEXT');
export const initRequest = createAction(prefix + 'INIT_REQUEST');
export const setCategories = createAction(prefix + 'SET_CATEGORIES');
export const setModels = createAction(prefix + 'SET_MODELS');
export const setIsReady = createAction(prefix + 'SET_IS_READY');
