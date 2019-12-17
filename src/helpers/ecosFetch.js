import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import { getCurrentLocale } from '../helpers/util';

const acceptLanguage = getCurrentLocale();

export default function(url, options = {}) {
  // Token.check();

  if (options === null) {
    return fetch(url);
  }

  const { method = 'POST', headers = {}, body } = options;

  const params = {
    method,
    headers: {
      ...headers,
      'Accept-Language': acceptLanguage
      //'Authorization': `Bearer ${Token.get().access_token}`
    }
  };

  if (url && url.includes('http')) {
    params.credentials = 'include';
  }

  if (isObject(body)) {
    params.body = JSON.stringify(body);
  } else if (isString(body)) {
    params.body = body;
  }

  return fetch(url, params);
}
