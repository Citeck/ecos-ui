import { handleActions } from 'redux-actions';

import { init, getBirthdays, setBirthdays } from '../actions/birthdays';

export const initialState = {
  birthdays: [],
  isLoading: false,
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
        isLoading: true
      }
    }),
    [setBirthdays]: (state, { payload }) => ({
      ...state,
      [payload.stateId]: {
        ...state[payload.stateId],
        birthdays: payload.data,
        isLoading: false
      }
    })
  },
  {}
);
