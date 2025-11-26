import i18next from 'i18next';
import isString from 'lodash/isString';

export const COOKIE_KEY_LOCALE = 'alf_share_locale';

const LOCALE_EN = 'en';

export function getCookie(name: string) {
  // eslint-disable-next-line
  let matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));

  return matches ? decodeURIComponent(matches[1]) : undefined;
}

export function getCurrentLocale() {
  const cookiesLocale = getCookie(COOKIE_KEY_LOCALE);

  if (cookiesLocale) {
    return cookiesLocale.substr(0, 2).toLowerCase();
  }

  if (!window.navigator) {
    return LOCALE_EN;
  }

  // @ts-ignore
  const language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.systemLanguage || navigator.userLanguage;

  return language.substr(0, 2).toLowerCase();
}

export function t(key: string, options?: any, scope = 'global') {
  if (!key) {
    return '';
  }

  if (!isString(key)) {
    return key;
  }

  if (i18next.exists(key)) {
    return i18next.t(key, options);
  }

  return key;
}
