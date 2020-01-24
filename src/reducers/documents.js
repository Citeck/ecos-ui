import { handleActions } from 'redux-actions';

import {
  init,
  initSuccess,
  getAvailableTypes,
  setAvailableTypes,
  setDynamicTypes,
  getDocumentsByType,
  setDocuments,
  saveSettings,
  saveSettingsFinally,
  uploadFiles,
  uploadFilesFinally,
  setConfig
} from '../actions/documents';

export const initialState = {
  types: [],
  config: {},
  availableTypes: [],
  dynamicTypes: [],
  documents: [],
  isLoading: false,
  isLoadingTableData: false,
  isUploadingFile: false,
  isLoadingSettings: false
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
          isLoadingSettings: false
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

    [getAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload]
        // isLoading: true
      }
    }),
    [setAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        availableTypes: payload.types
        // isLoading: false
      }
    }),

    [setDynamicTypes]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        dynamicTypes: payload.dynamicTypes
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
        isLoadingTableData: false
      }
    }),

    [saveSettings]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        isLoadingSettings: true
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
        isUploadingFile: true
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
    })
  },
  {}
);
