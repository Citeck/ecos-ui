import { createAction } from 'redux-actions';

const prefix = 'processStatistics/';

export const getModel = createAction(prefix + 'GET_MODEL');
export const getJournal = createAction(prefix + 'GET_JOURNAL');
export const filterJournal = createAction(prefix + 'FILTER_JOURNAL');

export const setLoading = createAction(prefix + 'SET_LOADING');
export const setModel = createAction(prefix + 'SET_MODEL');
export const setJournal = createAction(prefix + 'SET_JOURNAL');

export const resetDashlet = createAction(prefix + 'RESET_DASHLET');
