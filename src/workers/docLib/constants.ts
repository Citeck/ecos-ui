const prefix = 'docLib_files-upload_';

export const ACTION_CANCEL_REQUEST = 'CANCEL_REQUEST';

export const WORKER_STATUSES = {
  CONFIRM_FILE_REPLACE: prefix + 'confirm-file-replacement',
  CONFIRM_FILE_RESPONSE: prefix + 'confirmation-file-response',
  START_INIT_HANDLERS: prefix + 'start-initialization-handlers',
  PROGRESS_UPDATE: prefix + 'progress-update',
  UPLOAD_ERROR: prefix + 'upload-error',
  UPLOAD_SUCCESS: prefix + 'upload-success'
};

export const Endpoints = {
  CONTENT: '/gateway/emodel/api/ecos/webapp/content',
  DELETE_CHILDREN: '/gateway/api/records/delete',
  QUERY: '/gateway/api/records/query'
};

/**
 * Important! If you change the value of the object's fields here,
 * it is important not to forget to change them in public/custom-sw.js!
 *
 * Note: For any change to custom-sw.js needs to change the CACHE_NAME version
 **/
export const SERVICE_WORKER_TYPES = {
  PROGRESS: 'UPLOAD_PROGRESS',
  UPDATE_STATUS: 'UPDATE_UPLOAD_STATUS',
  FILE_RESPONSE: 'CONFIRMATION_FILE_RESPONSE',
  RENAME_DIR_REQUEST: 'CONFIRMATION_RENAME_DIR_REQUEST',
  RENAME_DIR_RESPONSE: 'CONFIRMATION_RENAME_DIR_RESPONSE'
};
