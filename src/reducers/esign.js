import { handleActions } from 'redux-actions';

import {
  init,
  initSuccess,
  initError,
  fetchApi,
  setApi,
  setCertificates,
  setMessage,
  clearMessage,
  setErrorType,
  signDocument,
  signDocumentSuccess,
  toggleSignModal
} from '../actions/esign';

export const initialState = {
  documentBase64: '',
  isOpen: false,
  isLoading: false,
  messageTitle: '',
  messageDescription: '',
  errorType: '',
  documentSigned: false
};

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
    [toggleSignModal]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isOpen: !state[payload].isOpen
      }
    }),
    [setApi]: (state, { payload }) => ({
      ...state,
      cadespluginApi: { ...payload.cadespluginApi },
      isFetchingApi: false
    }),
    [setCertificates]: (state, { payload }) => ({
      ...state,
      certificates: payload.certificates
    }),
    [setMessage]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        messageTitle: payload.messageTitle,
        messageDescription: payload.messageDescription,
        errorType: payload.errorType,
        isLoading: false
      }
    }),
    [clearMessage]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        messageTitle: '',
        messageDescription: '',
        errorType: '',
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
        isOpen: false,
        isLoading: false,
        documentSigned: true
      }
    })
  },
  generalState
);
