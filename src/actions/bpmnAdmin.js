import { createAction } from 'redux-actions';

const prefix = 'bpmn-admin/';

export const getProcesses = createAction(prefix + 'GET_PROCESSES');
export const setProcesses = createAction(prefix + 'SET_PROCESSES');

export const setFilter = createAction(prefix + 'SET_FILTER');
export const setPage = createAction(prefix + 'SET_PAGE');
export const setTotalCount = createAction(prefix + 'SET_TOTAL_COUNT');
