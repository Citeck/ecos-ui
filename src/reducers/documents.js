import { handleActions } from 'redux-actions';

import {
  getAvailableTypes,
  getDocumentsByType,
  getDocumentsByTypes,
  getDocumentsFinally,
  getTypeSettings,
  initFinally,
  initStore,
  initSuccess,
  saveSettings,
  saveSettingsFinally,
  setActions,
  setAvailableTypes,
  setConfig,
  setDocuments,
  setDocumentsByTypes,
  setDynamicTypes,
  setError,
  setInlineTools,
  setLoadingStatus,
  setTypeSettings,
  setTypeSettingsFinally,
  setUploadError,
  updateVersion,
  uploadFiles,
  uploadFilesFinally
} from '../actions/documents';

const emptyTools = Object.freeze({
  height: 0,
  top: 0,
  left: 0,
  row: {},
  actions: []
});
const emptyTypeSettings = Object.freeze({
  multiple: false,
  columns: []
});

/**
 * @description document state
 *
 * @member config - widget config includes what types show (set in widget)
 * @member typeSettings - type config (set in journal of types)
 * @member availableTypes - all types are available for widget
 * @member dynamicTypes - set types in widget
 * @member documents - documents for one type (when view is Desktop)
 * @member documentsByTypes - documents for set type (when view is Mobile)
 * @member actions - actions for type
 */
export const initialState = {
  stateId: '',
  config: {},
  typeSettings: { ...emptyTypeSettings },
  availableTypes: [],
  dynamicTypes: [],
  documents: [],
  documentsByTypes: {},
  actions: {},

  isLoading: false,
  isLoadingTableData: false,
  isUploadingFile: false,
  isLoadingSettings: false,
  isLoadingTypeSettings: false,
  isLoadingAvailableTypes: false,
  countFilesError: '',
  uploadError: '',
  tools: { ...emptyTools }
};

Object.freeze(initialState);

export default handleActions(
  {
    [initStore]: (state, { payload }) => {
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
        ...state[payload],
        isLoadingAvailableTypes: true
      }
    }),
    [setAvailableTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        availableTypes: payload.types,
        isLoadingAvailableTypes: false
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
    [getDocumentsFinally]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        isLoading: false,
        isLoadingTableData: false
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

    [getTypeSettings]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        isLoadingTypeSettings: true
      }
    }),
    [setTypeSettings]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        isLoadingTypeSettings: false,
        typeSettings: payload.settings
      }
    }),
    [setTypeSettingsFinally]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoadingTypeSettings: false
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
    [updateVersion]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
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
    }),

    [getDocumentsByTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        isLoading: true
      }
    }),
    [setDocumentsByTypes]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        documentsByTypes: payload.documentsByTypes,
        isLoading: false
      }
    }),
    [setLoadingStatus]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        [payload.loadindField || 'isLoading']: payload.status
      }
    })
  },
  {}
);
