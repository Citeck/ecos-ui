import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';

import { getCurrentLocale } from './export/util';

const acceptLanguage = getCurrentLocale();
const timezoneOffset = -new Date().getTimezoneOffset() / 60;

const ecosFetch = function(url, options = {}) {
  const { method, headers = {}, body, noHeaders = false, mode } = options;

  const params = {};

  if (method) {
    params.method = method;
  }

  if (!noHeaders) {
    params.headers = {
      ...headers,
      'Accept-Language': acceptLanguage,
      'X-ECOS-Timezone': timezoneOffset
    };
  }

  if (url && !url.includes('http')) {
    params.credentials = 'include';
  }

  if (isString(body) || body instanceof FormData) {
    params.body = body;
  } else if (!isEmpty(body)) {
    params.body = JSON.stringify(body);
    if (!params.headers['Content-type'] && !params.headers['Content-Type'] && !params.headers['content-type']) {
      params.headers['Content-type'] = 'application/json;charset=UTF-8';
    }
  }

  if (mode) {
    params.mode = mode;
  }

  return fetch(url, params).then(resp => {
    if (resp.status === 401) {
      window.location.reload();
    }
    return resp;
  });
};

export default ecosFetch;

if (window && !window.ecosFetch) {
  window.ecosFetch = ecosFetch;
}
