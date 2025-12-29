const prefix = 'docLib_files-upload_';

export const ACTION_CANCEL_REQUEST = prefix + 'CANCEL_REQUEST';

export const WORKER_STATUSES = {
  CONFIRM_FILE_REPLACE: prefix + 'confirm-file-replacement',
  CONFIRM_FILE_RESPONSE: prefix + 'confirmation-file-response',
  START_INIT_HANDLERS: prefix + 'start-initialization-handlers',
  PROGRESS_UPDATE: prefix + 'progress-update',
  UPLOAD_ERROR: prefix + 'upload-error',
  UPLOAD_SUCCESS: prefix + 'upload-success'
};

export const SERVICE_WORKER_TYPES = {
  PROGRESS: prefix + 'UPLOAD_PROGRESS',
  FILE_RESPONSE: prefix + 'CONFIRMATION_FILE_RESPONSE',
  RENAME_DIR_REQUEST: prefix + 'CONFIRMATION_RENAME_DIR_REQUEST',
  RENAME_DIR_RESPONSE: prefix + 'CONFIRMATION_RENAME_DIR_RESPONSE'
};

export const Endpoints = {
  CONTENT: '/gateway/emodel/api/ecos/webapp/content',
  DELETE_CHILDREN: '/gateway/api/records/delete',
  QUERY: '/gateway/api/records/query'
};
