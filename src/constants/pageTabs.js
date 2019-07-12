import { t } from '../helpers/util';
import { URL } from './';

export const IGNORE_TABS_HANDLER_ATTR_NAME = 'data-external';

export const SCROLL_STEP = 150;
export const LINK_TAG = 'A';
export const TITLE = {
  HOMEPAGE: 'Домашняя страница',
  [URL.HOME]: 'Домашняя страница',
  [URL.JOURNAL]: 'Журнал',
  [URL.DASHBOARD]: 'Домашняя страница',
  [URL.DASHBOARD_SETTINGS]: 'Настройки домашней страницы',
  [URL.BPMN_DESIGNER]: 'Редактор бизнес-процессов',

  // temporary pages
  '/v2/card-details': 'Карточка',
  [URL.JOURNAL_DASHBOARD]: 'Журнал дашборд [temp]',
  [URL.WIDGET_TASKS]: 'Задачи [temp]',
  [URL.WIDGET_COMMENTS]: 'Комментарии [temp]',
  [URL.WIDGET_PROPERTIES]: 'Свойства [temp]',
  [URL.WIDGET_DOC_PREVIEW]: 'Предпросмотр [temp]',
  [URL.CURRENT_TASKS]: 'Текущие задачи [temp]'
};

export const URL_MASK = {
  '^/v2/([0-9A-Za-z-]*)/card-details$': TITLE[URL.CARD_DETAILS],
  '^/v2/dashboard/([0-9A-Za-z-]*)/settings$': TITLE[URL.DASHBOARD_SETTINGS],
  '^/v2/dashboard/([0-9A-Za-z-]*)$': TITLE[URL.DASHBOARD]
};

export const getTitleByUrl = (url = '') => {
  const lastSymbolIsSlash = url.slice(-1) === '/';
  const title = TITLE[lastSymbolIsSlash ? url.slice(0, url.length - 1) : url];

  if (title) {
    return t(title);
  }

  const key = Object.keys(URL_MASK).find(mask => new RegExp(mask).test(url));

  return t(URL_MASK[key]);
};
