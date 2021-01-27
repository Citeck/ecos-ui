import { handleActions } from 'redux-actions';
import {
  getComments,
  setError,
  setComments,
  fetchStart,
  fetchEnd,
  sendingStart,
  sendingEnd,
  createCommentSuccess,
  updateCommentRequest,
  updateCommentSuccess,
  createCommentRequest,
  deleteCommentRequest,
  deleteCommentSuccess,
  setActionFailedStatus
} from '../actions/comments';

export const initialState = {
  comments: [],
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
    [getComments]: (state, action) => {
      let ownState = { ...initialState };

      if (state[action.payload]) {
        ownState = { ...ownState, ...state[action.payload] };
      }

      return {
        ...state,
        [action.payload]: { ...ownState }
      };
    },
    [setComments]: (state, action) => ({
      ...state,
      [action.payload.nodeRef]: {
        comments: action.payload.comments,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount
      }
    }),
    [createCommentRequest]: state => ({
      ...state
    }),
    [createCommentSuccess]: (state, action) => ({
      ...state,
      [action.payload.nodeRef]: {
        ...state[action.payload.nodeRef],
        comments: [...action.payload.comments],
        totalCount: state[action.payload.nodeRef].totalCount + 1,
        errorMessage: ''
      }
    }),
    [deleteCommentRequest]: state => ({
      ...state
    }),
    [deleteCommentSuccess]: (state, action) => ({
      ...state,
      [action.payload.nodeRef]: {
        ...state[action.payload.nodeRef],
        comments: [...action.payload.comments],
        totalCount: state[action.payload.nodeRef].totalCount - 1,
        errorMessage: ''
      }
    }),
    [setError]: (state, action) => ({
      ...state,
      [action.payload.nodeRef]: {
        ...state[action.payload.nodeRef],
        errorMessage: action.payload.message,
        sendingInProcess: false
      }
    }),
    [updateCommentRequest]: state => ({
      ...state
    }),
    [updateCommentSuccess]: (state, action) => ({
      ...state,
      [action.payload.nodeRef]: {
        ...state[action.payload.nodeRef],
        comments: [...action.payload.comments],
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
      [payload.nodeRef]: {
        ...state[payload.nodeRef],
        actionFailed: payload.status
      }
    })
  },
  {}
);
