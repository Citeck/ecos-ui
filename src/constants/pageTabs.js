import { t } from '../helpers/util';
import { URL } from './';

export const SCROLL_STEP = 150;
export const LINK_TAG = 'A';
export const TITLE = {
  HOMEPAGE: t('Домашняя страница'),
  [URL.HOME]: t('Домашняя страница'),
  [URL.JOURNAL]: t('Журнал'),
  [URL.JOURNAL_DASHBOARD]: t('Журнал дашборд')
};
