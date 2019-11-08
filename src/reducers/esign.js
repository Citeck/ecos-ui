import { handleActions } from 'redux-actions';

import {
  init,
  setApi,
  getCertificates,
  setCertificates,
  setMessage,
  setErrorType,
  selectCertificate,
  signDocument,
  signDocumentSuccess,
  initSuccess,
  fetchApi,
  initError
} from '../actions/esign';

export const initialState = {
  documentBase64: '',
  selectedCertificate: '',
  isLoading: false,
  messageTitle: '',
  messageDescription: '',
  errorType: '',
  documentSigned: false
};

// TODO: возможно, нужно добавить в generalState состояние лоадера api
export const generalState = {
  cadespluginApi: null,
  cadespluginVersion: null,
  certificates: [],
  isFetchingApi: false
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
    [fetchApi]: state => ({
      ...state,
      isFetchingApi: true
    }),
    [initError]: (state, { payload }) => ({
      ...state,
      isFetchingApi: false,
      [payload]: {
        ...state[payload],
        isLoading: false
      }
    }),
    [initSuccess]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: false
      }
    }),
    [setApi]: (state, { payload }) => ({
      ...state,
      cadespluginApi: { ...payload.cadespluginApi },
      isFetchingApi: false,
      [payload.id]: {
        ...state[payload.id],
        isLoading: false
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
      certificates: payload.certificates,
      [payload.id]: {
        ...state[payload.id],
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
    }),
    [selectCertificate]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        selectedCertificate: payload.certificate
      }
    }),
    [signDocument]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        isLoading: true
      }
    }),
    [signDocumentSuccess]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: false,
        documentSigned: true
      }
    })
  },
  generalState
);
