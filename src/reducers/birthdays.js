import { handleActions } from 'redux-actions';

import { init, getBirthdays, setBirthdays, setError } from '../actions/birthdays';

export const initialState = {
  birthdays: [],
  isLoading: false,
  totalCount: 0,
  error: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [init]: (state, { payload }) => {
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
        ...state[payload],
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
    })
  },
  {}
);
