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
  setActions,
  setInlineTools
} from '../actions/documents';

const emptyTools = Object.freeze({
  height: 0,
  top: 0,
  left: 0,
  row: {},
  actions: []
});
export const initialState = {
  stateId: '',
  config: {},
  availableTypes: [],
  dynamicTypes: [],
  documents: [],
  actions: {},
  isLoading: false,
  isLoadingTableData: false,
  isUploadingFile: false,
  isLoadingSettings: false,
  countFilesError: '',
  uploadError: '',
  tools: { ...emptyTools }
};

Object.freeze(initialState);

export default handleActions(
  {
    [init]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.key]) {
        ownState = { ...ownState, ...state[payload.key] };
      }

      return {
        ...state,
        [payload.key]: {
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
        stateId: payload,
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
      [payload.key]: {
        ...state[payload.key],
        availableTypes: payload.types
      }
    }),

    [setDynamicTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        dynamicTypes: payload.dynamicTypes,
        uploadError: '',
        countFilesError: ''
      }
    }),

    [getDocumentsByType]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        isLoadingTableData: true,
        tools: { ...emptyTools }
      }
    }),
    [setDocuments]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        documents: payload.documents,
        isLoadingTableData: false,
        uploadError: '',
        countFilesError: ''
      }
    }),

    [saveSettings]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
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
      [payload.key]: {
        ...state[payload.key],
        isUploadingFile: true,
        uploadError: '',
        countFilesError: ''
      }
    }),
    [setUploadError]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
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
      [payload.key]: {
        ...state[payload.key],
        config: payload.config
      }
    }),

    [setError]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        [payload.type]: payload.message
      }
    }),

    [setActions]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        actions: payload.actions
      }
    }),

    [setInlineTools]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        tools: payload.tools || { ...emptyTools }
      }
    })
  },
  {}
);
