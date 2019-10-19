import { handleActions } from 'redux-actions';
import { getCurrentStateById } from '../helpers/redux';
import { getPageData, setPageData, setError } from '../actions/webPage';

const initialState = {
  isLoading: false,
  error: '',
  url: '',
  title: ''
};

export default handleActions(
  {
    [getPageData]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        isLoading: true,
        error: ''
      }
    }),
    [setPageData]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        ...payload.data,
        isLoading: false,
        error: ''
      }
    }),
    [setError]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        error: payload.data,
        isLoading: false
      }
    })
  },
  {}
);
