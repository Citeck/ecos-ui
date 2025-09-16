import { handleActions } from 'redux-actions';
import {
  getComments,
  setError,
  setComments,
  fetchStart,
  fetchEnd,
  sendingStart,
  sendingEnd,
  uploadFilesInComment,
  uploadFilesFinally,
  createCommentSuccess,
  updateCommentRequest,
  updateCommentSuccess,
  createCommentRequest,
  deleteCommentRequest,
  deleteCommentSuccess,
  setActionFailedStatus,
} from '../actions/comments';

export const initialState = {
  comments: [],
  hasMore: false,
  totalCount: 0,
  fetchIsLoading: false,
  sendingInProcess: false,
  actionFailed: false,
  errorMessage: '',
};

Object.freeze(initialState);

export default handleActions(
  {
    [getComments]: (state, action) => {
      let ownState = { ...initialState };

      if (state[action.payload]) {
        ownState = { ...ownState, ...state[action.payload] };
      }

      return {
        ...state,
        [action.payload]: { ...ownState },
      };
    },
    [setComments]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        comments: action.payload.comments,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
      },
    }),
    [createCommentRequest]: (state) => ({
      ...state,
    }),
    [createCommentSuccess]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        comments: [...action.payload.comments],
        totalCount: state[action.payload.recordRef].totalCount + 1,
        errorMessage: '',
      },
    }),
    [deleteCommentRequest]: (state) => ({
      ...state,
    }),
    [deleteCommentSuccess]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        comments: [...action.payload.comments],
        totalCount: state[action.payload.recordRef].totalCount - 1,
        errorMessage: '',
      },
    }),
    [setError]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        errorMessage: action.payload.message,
        sendingInProcess: false,
      },
    }),
    [uploadFilesInComment]: (state, action) => ({
      ...state,
      [action.payload.record]: {
        ...state[action.payload.record],
        isUploadingFile: true,
      },
    }),
    [uploadFilesFinally]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isUploadingFile: false,
      },
    }),
    [updateCommentRequest]: (state) => ({
      ...state,
    }),
    [updateCommentSuccess]: (state, action) => ({
      ...state,
      [action.payload.recordRef]: {
        ...state[action.payload.recordRef],
        comments: [...action.payload.comments],
        errorMessage: '',
      },
    }),
    [fetchStart]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        actionFailed: false,
        fetchIsLoading: true,
      },
    }),
    [fetchEnd]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        fetchIsLoading: false,
      },
    }),
    [sendingStart]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        actionFailed: false,
        sendingInProcess: true,
      },
    }),
    [sendingEnd]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        sendingInProcess: false,
      },
    }),
    [setActionFailedStatus]: (state, { payload }) => ({
      ...state,
      [payload.recordRef]: {
        ...state[payload.recordRef],
        actionFailed: payload.status,
      },
    }),
  },
  {},
);
