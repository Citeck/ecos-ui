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

export const toggleType = createAction(prefix + 'TOGGLE_TYPE_IN_SETTINGS');

export const saveSettings = createAction(prefix + 'SAVE_SETTINGS');
export const saveSettingsFinally = createAction(prefix + 'SAVE_SETTINGS_FINALLY');

export const uploadFiles = createAction(prefix + 'UPLOAD_FILES');
export const uploadFilesSuccess = createAction(prefix + 'UPLOAD_FILES_SUCCESS');

export const setConfig = createAction(prefix + 'SET_WIDGET_CONFIG');
