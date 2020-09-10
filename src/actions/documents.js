import { createAction } from 'redux-actions';

const prefix = 'documents/';

export const initStore = createAction(prefix + 'INIT_WIDGET_STORE');
export const initSuccess = createAction(prefix + 'INIT_WIDGET_SUCCESS');
export const initFinally = createAction(prefix + 'INIT_WIDGET_FINALLY');

export const getDocumentTypes = createAction(prefix + 'GET_DOCUMENT_TYPES');
export const setDocumentTypes = createAction(prefix + 'SET_DOCUMENT_TYPES');

export const getAvailableTypes = createAction(prefix + 'GET_AVAILABLE_TYPES');
export const setAvailableTypes = createAction(prefix + 'SET_AVAILABLE_TYPES');

export const getDynamicTypes = createAction(prefix + 'GET_DYNAMIC_TYPES');
export const setDynamicTypes = createAction(prefix + 'SET_DYNAMIC_TYPES');

export const setDocuments = createAction(prefix + 'SET_DOCUMENTS');
export const getDocumentsByType = createAction(prefix + 'GET_DOCUMENTS_BY_TYPE');
export const getDocumentsByTypes = createAction(prefix + 'GET_DOCUMENTS_BY_TYPES');
export const setDocumentsByTypes = createAction(prefix + 'SET_DOCUMENTS_BY_TYPES');
export const getDocumentsFinally = createAction(prefix + 'GET_DOCUMENTS_FINALLY');

export const getTypeSettings = createAction(prefix + 'GET_TYPE_SETTINGS');
export const setTypeSettings = createAction(prefix + 'SET_TYPE_SETTINGS');
export const setTypeSettingsFinally = createAction(prefix + 'SET_TYPE_SETTINGS_FINALLY');

export const saveSettings = createAction(prefix + 'SAVE_SETTINGS');
export const saveSettingsFinally = createAction(prefix + 'SAVE_SETTINGS_FINALLY');

export const uploadFiles = createAction(prefix + 'UPLOAD_FILES');
export const setUploadError = createAction(prefix + 'SET_UPLOAD_ERROR');
export const uploadFilesFinally = createAction(prefix + 'UPLOAD_FILES_FINALLY');

export const setConfig = createAction(prefix + 'SET_WIDGET_CONFIG');

export const getActions = createAction(prefix + 'GET_ACTIONS');
export const setActions = createAction(prefix + 'SET_ACTIONS');

export const execRecordsAction = createAction(prefix + 'EXECUTE_RECORDS_ACTIONS');

export const setInlineTools = createAction(prefix + 'SET_INLINE_TOOLS');

export const setError = createAction(prefix + 'SET_ERROR');

export const updateVersion = createAction(prefix + 'UPDATE_VERSION');
