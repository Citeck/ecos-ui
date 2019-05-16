import { URL } from './';

export const SCROLL_STEP = 150;

export function getTitle(url) {
  let cleanUrl = url.replace(/\?.*/i, '');

  cleanUrl = cleanUrl.replace(/#.*/i, '');

  return TITLE[cleanUrl];
}

export const TITLE = {
  [URL.HOME]: 'Домашняя страница',
  [URL.JOURNAL]: 'Журнал',
  [URL.JOURNAL_DASHBOARD]: 'Журнал дашборд'
};
