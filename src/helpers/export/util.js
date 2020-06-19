import isString from 'lodash/isString';
import i18next from 'i18next';

export const COOKIE_KEY_LOCALE = 'alf_share_locale';

const LOCALE_EN = 'en';

export function getCookie(name) {
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

  const language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.systemLanguage || navigator.userLanguage;

  return language.substr(0, 2).toLowerCase();
}

export function t(key, options, scope = 'global') {
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
