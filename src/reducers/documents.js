import { handleActions } from 'redux-actions';

import {
  init,
  initSuccess,
  initFinally,
  getAvailableTypes,
  setAvailableTypes,
  setDynamicTypes,
  getDocumentsByType,
  setDocuments,
  saveSettings,
  saveSettingsFinally,
  uploadFiles,
  setUploadError,
  uploadFilesFinally,
  setConfig,
  setError,
  setActions
} from '../actions/documents';

export const initialState = {
  types: [],
  config: {},
  availableTypes: [],
  dynamicTypes: [],
  documents: [],
  actions: [],
  isLoading: false,
  isLoadingTableData: false,
  isUploadingFile: false,
  isLoadingSettings: false,
  countFilesError: '',
  uploadError: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [init]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.record]) {
        ownState = { ...ownState, ...state[payload.record] };
      }

      return {
        ...state,
        [payload.record]: {
          ...ownState,
          isLoading: true,
          isLoadingSettings: false,
          uploadError: '',
          countFilesError: ''
        }
      };
    },
    [initSuccess]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: false
      }
    }),
    [initFinally]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: false
      }
    }),

    [getAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload]
      }
    }),
    [setAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        availableTypes: payload.types
      }
    }),

    [setDynamicTypes]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        dynamicTypes: payload.dynamicTypes,
        uploadError: '',
        countFilesError: ''
      }
    }),

    [getDocumentsByType]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        isLoadingTableData: true
      }
    }),
    [setDocuments]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        documents: payload.documents,
        isLoadingTableData: false,
        uploadError: '',
        countFilesError: ''
      }
    }),

    [saveSettings]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        isLoadingSettings: true,
        uploadError: '',
        countFilesError: ''
      }
    }),
    [saveSettingsFinally]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoadingSettings: false
      }
    }),

    [uploadFiles]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        isUploadingFile: true,
        uploadError: '',
        countFilesError: ''
      }
    }),
    [setUploadError]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        uploadError: payload.message,
        countFilesError: ''
      }
    }),
    [uploadFilesFinally]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isUploadingFile: false
      }
    }),

    [setConfig]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        config: payload.config
      }
    }),

    [setError]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        [payload.type]: payload.message
      }
    }),

    [setActions]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        actions: payload.actions
      }
    })
  },
  {}
);
