import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import { getCurrentLocale } from '../helpers/util';
//import Token from '../helpers/tokenData';

const acceptLanguage = getCurrentLocale();

export default function(url, options = {}) {
  // Token.check();

  const { method, headers = {}, body, noHeaders = false } = options;

  const params = {};

  if (method) {
    params.method = method;
  }

  if (!noHeaders) {
    params.headers = {
      ...headers,
      'Accept-Language': acceptLanguage
      //'Authorization': `Bearer ${Token.get().access_token}`
    };
  }

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
