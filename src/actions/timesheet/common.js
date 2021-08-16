import { createAction } from 'redux-actions';

const prefix = 'timesheet/common/';

export const getTotalCounts = createAction(prefix + 'GET_TOTAL_COUNTS');
export const setTotalCounts = createAction(prefix + 'SET_TOTAL_COUNTS');

export const setUsers = createAction(prefix + 'SET_USERS');
