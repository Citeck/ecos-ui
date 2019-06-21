import { handleActions } from 'redux-actions';
import {
  getComments,
  createComment,
  deleteComment,
  setError,
  updateComment,
  setComments,
  fetchStart,
  fetchEnd,
  sendingStart,
  sendingEnd
} from '../actions/comments';

const initialState = {
  comments: [],
  hasMore: false,
  totalCount: 0,
  fetchIsLoading: false,
  sendingInProcess: false
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
    [createComment]: (state, action) => ({
      ...state
    }),
    [deleteComment]: (state, action) => ({
      ...state
    }),
    [setError]: (state, action) => ({
      ...state
    }),
    [updateComment]: (state, action) => ({
      ...state
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
