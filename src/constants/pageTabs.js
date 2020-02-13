import { t } from '../helpers/util';
import { URL } from './';

export const IGNORE_TABS_HANDLER_ATTR_NAME = 'data-external';
export const REMOTE_TITLE_ATTR_NAME = 'data-remote-title';
export const OPEN_IN_BACKGROUND = 'data-open-in-background';

export const SCROLL_STEP = 150;
export const LINK_TAG = 'A';
export const LINK_HREF = 'href';
export const TITLE = {
  HOMEPAGE: 'header.site-menu.home-page',
  NEW_TAB: 'page-tabs.new-tab',
  LOADING: 'page-tabs.loading',
  NO_NAME: 'page-tabs.no-name',
  [URL.HOME]: 'header.site-menu.home-page',
  [URL.JOURNAL]: 'page-tabs.journal',
  [URL.DASHBOARD]: 'header.site-menu.home-page',
  [URL.DASHBOARD_SETTINGS]: 'page-tabs.dashboard-settings',
  [URL.BPMN_DESIGNER]: 'page-tabs.bpmn-designer',
  [URL.TIMESHEET]: 'page-tabs.timesheet',
  [URL.TIMESHEET_SUBORDINATES]: 'page-tabs.timesheet',
  [URL.TIMESHEET_FOR_VERIFICATION]: 'page-tabs.timesheet',
  [URL.TIMESHEET_DELEGATED]: 'page-tabs.timesheet'
};

export const URL_MASK = {
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
