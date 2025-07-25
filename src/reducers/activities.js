import { handleActions } from 'redux-actions';

import {
  getActivities,
  setError,
  setActivities,
  fetchStart,
  fetchEnd,
  sendingStart,
  sendingEnd,
  uploadFilesInActivity,
  uploadFilesFinally,
  createActivitySuccess,
  updateActivityRequest,
  updateActivitySuccess,
  createActivityRequest,
  deleteActivityRequest,
  deleteActivitySuccess,
  setActionFailedStatus
} from '../actions/activities';

export const initialState = {
  activityTypes: [],
  activities: [],
  hasMore: false,
  totalCount: 0,
  fetchIsLoading: false,
  sendingInProcess: false,
  actionFailed: false,
  errorMessage: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [getActivities]: (state, action) => {
      let ownState = { ...initialState };

      if (state[action.payload]) {
        ownState = { ...ownState, ...state[action.payload] };
      }

      return {
        ...state,
        [action.payload]: { ...ownState }
      };
    },
    [setActivities]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        activityTypes: action.payload.activityTypes,
        activities: action.payload.activities,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount
      }
    }),
    [createActivityRequest]: state => ({
      ...state
    }),
    [createActivitySuccess]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        activities: [...action.payload.activities],
        totalCount: state[action.payload.recordRef].totalCount + 1,
        errorMessage: ''
      }
    }),
    [deleteActivityRequest]: state => ({
      ...state
    }),
    [deleteActivitySuccess]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.nodeRef],
        activities: [...action.payload.activities],
        totalCount: state[action.payload.recordRef].totalCount - 1,
        errorMessage: ''
      }
    }),
    [setError]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        errorMessage: action.payload.message,
        sendingInProcess: false
      }
    }),
    [uploadFilesInActivity]: (state, action) => ({
      ...state,
      [action.payload.record]: {
        ...state[action.payload.record],
        isUploadingFile: true
      }
    }),
    [uploadFilesFinally]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isUploadingFile: false
      }
    }),
    [updateActivityRequest]: state => ({
      ...state
    }),
    [updateActivitySuccess]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        activities: [...action.payload.activities],
        errorMessage: ''
      }
    }),
    [fetchStart]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        actionFailed: false,
        fetchIsLoading: true
      }
    }),
    [fetchEnd]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        fetchIsLoading: false
      }
    }),
    [sendingStart]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        actionFailed: false,
        sendingInProcess: true
      }
    }),
    [sendingEnd]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        sendingInProcess: false
      }
    }),
    [setActionFailedStatus]: (state, { payload }) => ({
      ...state,
      [payload.recordRef]: {
        ...state[payload.recordRef],
        actionFailed: payload.status
      }
    })
  },
  {}
);
