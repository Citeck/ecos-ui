import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import { getCurrentLocale } from '../helpers/util';

const acceptLanguage = getCurrentLocale();

export function ecosFetch(url, data) {
  const { method = 'POST', headers = {}, body } = data || {};

  if (!url) {
    return;
  }

  const params = {
    method,
    credentials: 'include',
    headers: {
      ...headers,
      'Accept-Language': acceptLanguage,
      'Content-type': 'application/json;charset=UTF-8'
    }
  };

  if (isObject(body)) {
    params.body = JSON.stringify(body);
  } else if (isString(body)) {
    params.body = body;
  }

  return fetch(url, params);
}
