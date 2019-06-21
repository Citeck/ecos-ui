import { handleActions } from 'redux-actions';
import { getComments, createComment, deleteComment, setError, updateComment } from '../actions/comments';

const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [getComments]: (state, action) => ({
      ...state
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
    })
  },
  initialState
);
