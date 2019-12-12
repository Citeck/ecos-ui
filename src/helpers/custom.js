import { getCurrentLocale } from '../helpers/util';

const acceptLanguage = getCurrentLocale();

export function customFetch(settings) {
  const { url, method = 'POST', headers = {}, json, str } = settings;

  if (!url) {
    return;
  }

  const params = {
    method,
    headers: {
      ...headers,
      'Accept-Language': acceptLanguage
    }
  };

  if (json) {
    params.body = JSON.stringify(json);
    params.headers['Content-Type'] = 'application/json';
  } else if (str) {
    params.body = str;
  }

  return fetch(url, params).then(response => response.json());
}
