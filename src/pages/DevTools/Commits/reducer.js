import { SET_REPOS, SET_COMMITS, SET_IS_READY, SET_ERROR, SELECT_REPO } from './actions';
import { ALL_REPOS } from './constants';

export const initialState = {
  isReady: false,
  error: null,
  repos: {},
  commits: [],
  repo: ALL_REPOS
};

export function reducer(state, { type, payload }) {
  switch (type) {
    case SET_REPOS:
      return {
        ...state,
        repos: payload
      };
    case SET_COMMITS:
      return {
        ...state,
        commits: payload
      };
    case SET_IS_READY:
      return {
        ...state,
        isReady: payload
      };
    case SET_ERROR:
      return {
        ...state,
        error: payload
      };
    case SELECT_REPO:
      return {
        ...state,
        repo: payload
      };
    default:
      throw new Error('[DevTools Commits reducer] Unknown action type');
  }
}
