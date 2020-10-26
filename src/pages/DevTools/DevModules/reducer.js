import { SET_GRID_DATA, SET_GRID_COLUMNS, SET_GRID_ACTIONS, SET_IS_READY, SET_ERROR } from './actions';

export const initialState = {
  isReady: false,
  error: null,
  actions: [],
  columns: [],
  data: []
};

export function reducer(state, { type, payload }) {
  switch (type) {
    case SET_GRID_ACTIONS:
      return {
        ...state,
        actions: payload
      };
    case SET_GRID_COLUMNS:
      return {
        ...state,
        columns: payload
      };
    case SET_GRID_DATA:
      return {
        ...state,
        data: payload
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
    default:
      throw new Error('[DevTools DevModules reducer] Unknown action type');
  }
}
