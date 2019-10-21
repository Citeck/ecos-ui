import { handleActions } from 'redux-actions';
import { getCurrentStateById } from '../helpers/redux';
import { getPageData, setPageData, setError, initPage } from '../actions/webPage';

export const initialState = {
  isLoading: false,
  error: '',
  url: '',
  title: ''
};

export default handleActions(
  {
    [initPage]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload]) {
        ownState = { ...ownState, ...state[payload] };
      }

      return {
        ...state,
        [payload]: { ...ownState }
      };
    },
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
