import { handleActions } from 'redux-actions';

import { init, setApi, getCertificates, setCertificates, setMessage, setErrorType } from '../actions/esign';

export const initialState = {
  documentBase64: '',
  selectedCertificate: '',
  certificates: [],
  isLoading: false,
  messageTitle: '',
  messageDescription: '',
  errorType: ''
};
export const generalState = {
  cadespluginApi: null,
  cadespluginVersion: null
};

Object.freeze(initialState);
Object.freeze(generalState);

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
          ...ownState,
          isLoading: true,
          messageTitle: '',
          messageDescription: '',
          errorType: ''
        }
      };
    },
    [setApi]: (state, { payload }) => ({
      ...state,
      cadespluginApi: { ...payload.cadespluginApi },
      isLoading: false
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
    }),
    [setMessage]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        messageTitle: payload.messageTitle,
        messageDescription: payload.messageDescription,
        isLoading: false
      }
    }),
    [setErrorType]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        errorType: payload.errorType
      }
    })
  },
  generalState
);
