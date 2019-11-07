import { handleActions } from 'redux-actions';

import { init, setApi, getCertificates, setCertificates } from '../actions/esign';

export const initialState = {
  cadespluginApi: null,
  cadespluginVersion: null,
  documentBase64: '',
  selectedCertificate: '',
  certificates: [],
  isLoading: false
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
        [payload]: { ...ownState }
      };
    },
    [setApi]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        cadespluginApi: { ...payload.cadespluginApi }
      }
    }),
    [getCertificates]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: true
      }
    }),
    [setCertificates]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        certificates: payload.certificates,
        selectedCertificate: payload.selectedCertificate,
        isLoading: false
      }
    })
  },
  {}
);
