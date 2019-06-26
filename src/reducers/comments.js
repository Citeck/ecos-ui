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
  deleteCommentSuccess
} from '../actions/comments';

const initialState = {
  comments: [],
  hasMore: false,
  totalCount: 0,
  fetchIsLoading: false,
  sendingInProcess: false,
  errorMessage: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [getComments]: (state, action) => ({
      ...state
    }),
    [setComments]: (state, action) => ({
      ...state,
      comments: action.payload.comments,
      hasMore: action.payload.hasMore,
      totalCount: action.payload.totalCount
    }),
    [createCommentRequest]: (state, action) => ({
      ...state
    }),
    [createCommentSuccess]: (state, action) => ({
      ...state,
      comments: [...action.payload],
      totalCount: state.totalCount + 1,
      errorMessage: ''
    }),
    [deleteCommentRequest]: (state, action) => ({
      ...state
    }),
    [deleteCommentSuccess]: (state, action) => ({
      ...state,
      comments: [...action.payload],
      totalCount: state.totalCount - 1,
      errorMessage: ''
    }),
    [setError]: (state, action) => ({
      ...state,
      errorMessage: action.payload,
      sendingInProcess: false
    }),
    [updateCommentRequest]: (state, action) => ({
      ...state
    }),
    [updateCommentSuccess]: (state, action) => ({
      ...state,
      comments: [...action.payload],
      errorMessage: ''
    }),
    [fetchStart]: (state, action) => ({
      ...state,
      fetchIsLoading: true
    }),
    [fetchEnd]: (state, action) => ({
      ...state,
      fetchIsLoading: false
    }),
    [sendingStart]: (state, action) => ({
      ...state,
      sendingInProcess: true
    }),
    [sendingEnd]: (state, action) => ({
      ...state,
      sendingInProcess: false
    })
  },
  initialState
);
