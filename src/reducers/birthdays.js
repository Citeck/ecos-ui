import { handleActions } from 'redux-actions';

import { getBirthdays, initStore, resetStore, setBirthdays, setError } from '../actions/birthdays';
import { getCurrentStateById } from '../helpers/redux';

export const initialState = {
  birthdays: [],
  isLoading: false,
  totalCount: 0,
  error: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [initStore]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload]) {
        ownState = { ...ownState, ...state[payload] };
      }

      return {
        ...state,
        [payload]: {
          ...ownState
        }
      };
    },
    [getBirthdays]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...getCurrentStateById(state, payload, initialState),
        error: '',
        isLoading: true
      }
    }),
    [setBirthdays]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...state[payload.stateId],
        ...payload.data,
        isLoading: false
      }
    }),
    [setError]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...state[payload.stateId],
        error: payload.data,
        isLoading: false
      }
    }),
    [resetStore]: (state, { payload }) => {
      delete state[payload];

      return state;
    }
  },
  {}
);
