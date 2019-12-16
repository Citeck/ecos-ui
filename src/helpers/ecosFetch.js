import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import { getCurrentLocale } from '../helpers/util';

const acceptLanguage = getCurrentLocale();

export default function(url, data = {}) {
  // Token.check();

  if (!url) {
    return;
  }

  if (data === null) {
    return fetch(url);
  }

  const { method = 'POST', headers = {}, body } = data;

  const params = {
    method,
    credentials: 'include',
    headers: {
      ...headers,
      'Accept-Language': acceptLanguage
      //'Authorization': `Bearer ${Token.get().access_token}`
    }
  };

  if (isObject(body)) {
    params.body = JSON.stringify(body);
  } else if (isString(body)) {
    params.body = body;
  }

  return fetch(url, params);
}
