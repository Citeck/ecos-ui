import { createAction } from 'redux-actions';

const prefix = 'processStatistics/';

export const getModel = createAction(prefix + 'GET_MODEL');
export const getJournal = createAction(prefix + 'GET_JOURNAL');
export const filterJournal = createAction(prefix + 'FILTER_JOURNAL');
export const filterHeatdata = createAction(prefix + 'FILTER_HEATDATA');

export const setLoading = createAction(prefix + 'SET_LOADING');
export const setModel = createAction(prefix + 'SET_MODEL');
export const setJournal = createAction(prefix + 'SET_JOURNAL');
export const setNewData = createAction(prefix + 'SET_NEW_DATA');

export const resetDashlet = createAction(prefix + 'RESET_DASHLET');

export const changeFilter = createAction(prefix + 'CHANGE_FILTER');
export const setFilters = createAction(prefix + 'SET_FILTERS');

export const changePagination = createAction(prefix + 'CHANGE_PAGE');
export const setPagination = createAction(prefix + 'SET_PAGE');
export const resetFilter = createAction(prefix + 'RESET_FILTER');