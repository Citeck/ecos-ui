import { handleActions } from 'redux-actions';

import {
  init,
  initSuccess,
  getAvailableTypes,
  setAvailableTypes,
  setDynamicTypes,
  setDocuments,
  saveSettings,
  saveSettingsFinally,
  uploadFiles,
  uploadFilesSuccess
} from '../actions/documents';

export const initialState = {
  types: [],
  availableTypes: [],
  dynamicTypes: [],
  documents: [],
  isLoading: false,
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
        ...state[payload],
        isLoading: true
      }
    }),
    [setAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        availableTypes: payload.types,
        isLoading: false
      }
    }),

    [setDynamicTypes]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        dynamicTypes: payload.dynamicTypes
      }
    }),

    [setDocuments]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        documents: payload.documents
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
    [uploadFilesSuccess]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isUploadingFile: false
      }
    })
  },
  {}
);
