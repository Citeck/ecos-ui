import { handleActions } from 'redux-actions';

import { init } from '../actions/esign';

export const initialState = {
  apiIsAvailable: false,
  documentBase64: '',
  selectedCertificate: '',
  certificates: [],
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [init]: (state, action) => {
      let ownState = { ...initialState };

      if (state[action.payload]) {
        ownState = { ...ownState, ...state[action.payload] };
      }

      return {
        ...state,
        [action.payload]: { ...ownState }
      };
    }
  },
  {}
);
