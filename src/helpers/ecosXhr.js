import isString from 'lodash/isString';

import { getCurrentLocale } from '../helpers/util';
//import Token from '../helpers/tokenData';

const acceptLanguage = getCurrentLocale();

export default function(url, options = {}) {
  // Token.check();
  const { method, headers = {}, body, noHeaders = false, responseType = 'json', handleProgress } = options;

  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    const state = {
      status: FileStatuses.PREPARING,
      percent: 0
    };

    let data = {};
    let contentType = '';

    xhr.open(method, url, true);
    xhr.responseType = responseType;

    if (body instanceof FormData) {
      data = body;
    } else if (isString(body)) {
      data = body;
      contentType = 'text/plain';
    } else {
      data = JSON.stringify(body);
      contentType = 'application/json; charset=utf-8';
    }

    if (!noHeaders) {
      const header = {
        ...headers,
        'Accept-Language': acceptLanguage,
        'X-Requested-With': 'XMLHttpRequest'
        //'Authorization': `Bearer ${Token.get().access_token}`
      };

      if (contentType) {
        header['Content-type'] = contentType;
      }

      for (const name in header) {
        xhr.setRequestHeader(name, header[name]);
      }
    }

    if (url && url.includes('http')) {
      xhr.withCredentials = true;
    }

    xhr.onload = function() {
      if (xhr.status == 200) {
        resolve(xhr.response);
      } else {
        reject(Error(`${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = reject;

    if (handleProgress) {
      xhr.upload.onloadstart = function() {
        handleProgress({ ...state, status: FileStatuses.UPLOADING }, xhr);
      };

      xhr.upload.onprogress = function(e) {
        state.percent = (e.loaded * 100.0) / e.total || 100;
        handleProgress(state, xhr);
      };

      xhr.onabort = function() {
        handleProgress({ ...state, status: FileStatuses.ABORTED }, xhr);
        reject('');
      };

      xhr.onreadystatechange = function() {
        if (xhr.readyState !== 2 && xhr.readyState !== 4) return;

        if (xhr.status === 0) {
          state.status = FileStatuses.EXCEPTION_UPLOAD;
        }

        if (xhr.status > 0 && xhr.status < 400) {
          state.percent = 100;
          if (xhr.readyState === 2) {
            state.status = FileStatuses.HEADERS_RECEIVED;
          }
          if (xhr.readyState === 4) {
            state.status = FileStatuses.DONE;
          }
        }

        if (xhr.status >= 400) {
          state.status = FileStatuses.ERROR_UPLOAD;
        }

        handleProgress({ ...state, response: xhr.response }, xhr);
      };
    }

    handleProgress && handleProgress(state, xhr);

    xhr.send(data);
  });
}

export const FileStatuses = {
  REJECT_FILE_TYPE: 'rejected_file_type',
  REJECT_MAX_FILES: 'rejected_max_files',
  PREPARING: 'preparing',
  ERROR_FILE_SIZE: 'error_file_size',
  ERROR_VALIDATION: 'error_validation',
  READY: 'ready',
  STARTED: 'started',
  GETTING_UPLOAD_PARAMS: 'getting_upload_params',
  ERROR_UPLOAD_PARAMS: 'error_upload_params',
  UPLOADING: 'uploading',
  EXCEPTION_UPLOAD: 'exception_upload',
  ABORTED: 'aborted',
  RESTARTED: 'restarted',
  REMOVED: 'removed',
  ERROR_UPLOAD: 'error_upload',
  HEADERS_RECEIVED: 'headers_received',
  DONE: 'done'
};
