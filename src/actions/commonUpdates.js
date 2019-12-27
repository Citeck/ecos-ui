import { createAction } from 'redux-actions';

const prefix = 'commonUpdates/';

export const requestUpdateDataByRecord = createAction(prefix + 'REQUEST_UPDATE_DATA_BY_RECORD');
export const resetUpdateDataByRecord = createAction(prefix + 'RESET_UPDATE_DATA_BY_RECORD');
