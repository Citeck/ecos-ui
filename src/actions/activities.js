import { createAction } from 'redux-actions';

const prefix = 'activities/';

export const getActivities = createAction(prefix + 'GET_ACTIVITIES');
export const setActivities = createAction(prefix + 'SET_ACTIVITIES');

export const createActivityRequest = createAction(prefix + 'CREATE_ACTIVITY_REQUEST');
export const createActivitySuccess = createAction(prefix + 'CREATE_ACTIVITY_SUCCESS');

export const updateActivityRequest = createAction(prefix + 'UPDATE_ACTIVITY_REQUEST');
export const updateActivitySuccess = createAction(prefix + 'UPDATE_ACTIVITY_SUCCESS');
export const uploadFilesInActivity = createAction(prefix + 'UPLOAD_FILES_IN_ACTIVITIES');

export const deleteActivityRequest = createAction(prefix + 'DELETE_ACTIVITY_REQUEST');
export const deleteActivitySuccess = createAction(prefix + 'DELETE_ACTIVITY_SUCCESS');

export const setError = createAction(prefix + 'SET_ERROR');

export const fetchStart = createAction(prefix + 'FETCH_START');
export const fetchEnd = createAction(prefix + 'FETCH_END');
export const sendingStart = createAction(prefix + 'SENDING_START');
export const sendingEnd = createAction(prefix + 'SENDING_END');

export const uploadFilesFinally = createAction(prefix + 'UPLOAD_FILES_FINALLY');

export const setActionFailedStatus = createAction(prefix + 'SET_ACTION_FAILED_STATUS');
