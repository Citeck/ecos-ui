import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import { getCurrentStateById } from '../helpers/redux';
import {
  getPageData,
  startLoadingPage,
  setPageData,
  setError,
  initPage,
  loadedPage,
  reloadPageData,
  changePageData
} from '../actions/webPage';

export const initialState = {
  fetchIsLoading: true,
  pageIsLoading: false,
  error: '',
  url: '',
  title: ''
};

export default handleActions(
  {
    [initPage]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.stateId]) {
        ownState = { ...ownState, ...state[payload.stateId] };
      }

      return {
        ...state,
        [payload.stateId]: { ...ownState }
      };
    },
    [getPageData]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...getCurrentStateById(state, payload, initialState),
        fetchIsLoading: true,
        pageIsLoading: false,
        error: ''
      }
    }),
    [setPageData]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        ...payload.data,
        fetchIsLoading: false,
        pageIsLoading: !!get(payload, 'data.url', false),
        error: ''
      }
    }),
    [setError]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        error: payload.data,
        fetchIsLoading: false,
        pageIsLoading: false
      }
    }),
    [loadedPage]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...getCurrentStateById(state, payload, initialState),
        error: '',
        fetchIsLoading: false,
        pageIsLoading: false
      }
    }),
    [reloadPageData]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        error: '',
        url: '',
        fetchIsLoading: true,
        pageIsLoading: false
      }
    }),
    [startLoadingPage]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        error: '',
        pageIsLoading: true
      }
    }),
    [changePageData]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...getCurrentStateById(state, payload.stateId, initialState),
        error: '',
        url: '',
        fetchIsLoading: true
      }
    })
  },
  {}
);
