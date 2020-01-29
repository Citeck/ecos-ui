import { createAction } from 'redux-actions';

const prefix = 'documents/';

export const init = createAction(prefix + 'INIT_WIDGET');
export const initSuccess = createAction(prefix + 'INIT_WIDGET_SUCCESS');

export const getDocumentTypes = createAction(prefix + 'GET_DOCUMENT_TYPES');
export const setDocumentTypes = createAction(prefix + 'SET_DOCUMENT_TYPES');

export const getAvailableTypes = createAction(prefix + 'GET_AVAILABLE_TYPES');
export const setAvailableTypes = createAction(prefix + 'SET_AVAILABLE_TYPES');

export const setDynamicTypes = createAction(prefix + 'SET_DYNAMIC_TYPES');

export const setDocuments = createAction(prefix + 'SET_DOCUMENTS');
export const getDocumentsByType = createAction(prefix + 'SET_DOCUMENTS_BY_TYPE');

export const saveSettings = createAction(prefix + 'SAVE_SETTINGS');
export const saveSettingsFinally = createAction(prefix + 'SAVE_SETTINGS_FINALLY');

export const uploadFiles = createAction(prefix + 'UPLOAD_FILES');
export const setUploadError = createAction(prefix + 'SET_UPLOAD_ERROR');
export const uploadFilesFinally = createAction(prefix + 'UPLOAD_FILES_FINALLY');

export const setConfig = createAction(prefix + 'SET_WIDGET_CONFIG');

export const setError = createAction(prefix + 'SET_ERROR');
