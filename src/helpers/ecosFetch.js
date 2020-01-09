import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';

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

  if (isString(body) || body instanceof FormData) {
    params.body = body;
  } else if (!isEmpty(body)) {
    params.body = JSON.stringify(body);
  }

  return fetch(url, params);
}
