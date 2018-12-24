import { createAction } from 'redux-actions';

const prefix = 'bpmn/';

export const setViewType = createAction(prefix + 'SET_VIEW_TYPE');
export const setActiveSortFilter = createAction(prefix + 'SET_ACTIVE_SORT_FILTER');
export const setSearchText = createAction(prefix + 'SET_SEARCH_TEXT');
