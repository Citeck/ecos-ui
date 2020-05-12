import queryString from 'query-string';
import get from 'lodash/get';

import { URL } from '../constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME, LINK_HREF, LINK_TAG, OPEN_IN_BACKGROUND, TITLE } from '../constants/pageTabs';
import { getCurrentUserName, t } from '../helpers/util';
import { decodeLink, getLinkWithout, isNewVersionPage, SearchKeys } from '../helpers/urls';
import { getData, isExistLocalStorage, setData } from '../helpers/ls';
import { PageApi } from '../api';

const pageApi = new PageApi();

export const PageTypes = {
  DASHBOARD: 'dashboard',
  JOURNALS: 'journals',
  SETTINGS: 'dashboard/settings',
  BPMN_DESIGNER: 'bpmn-designer',
  TIMESHEET: 'timesheet'
};

export const Events = {
  CHANGE_URL_LINK_EVENT: 'CHANGE_URL_LINK_EVENT'
};

const CHANGE_URL = document.createEvent('Event');
CHANGE_URL.initEvent(Events.CHANGE_URL_LINK_EVENT, true, true);

export default class PageService {
  static eventIsDispatched = false;

  static getType(link) {
    const _link = link || window.location.href;
    const found = queryString.parseUrl(_link).url.split('/v2/');

    return get(found, '[1]', '');
  }

  static getKey({ link, type }) {
    const _link = link || window.location.href;
    const _type = type || PageService.getType(_link);

    const urlProps = queryString.parseUrl(_link);

    switch (_type) {
      case PageTypes.SETTINGS:
        return urlProps.query.dashboardId || '';
      case PageTypes.DASHBOARD:
        return urlProps.query.recordRef || '';
      case PageTypes.JOURNALS:
        return urlProps.query.journalsListId || '';
      default:
        return '';
    }
  }

  static keyId({ link, type, key }) {
    const _type = type || PageService.getType(link);
    const _key = key || PageService.getKey({ link, type });

    return `${_type}-${_key}`;
  }

  static getPage({ link, type }) {
    const _type = type || PageService.getType(link);

    return PageService.pageTypes[_type] || getDefaultPage();
  }

  static pageTypes = Object.freeze({
    [PageTypes.DASHBOARD]: {
      getTitle: ({ recordRef }) => {
        return recordRef ? pageApi.getRecordTitle(recordRef).then(title => convertTitle(title)) : staticTitle(TITLE.HOMEPAGE);
      }
    },
    [PageTypes.JOURNALS]: {
      getTitle: ({ journalId }) => {
        const prom = pageApi.getJournalTitle(journalId);

        return prom.then(title => `${t('page-tabs.journal')} "${convertTitle(title)}"`);
      }
    },
    [PageTypes.SETTINGS]: {
      getTitle: ({ recordRef, journalId }) => {
        const prom = journalId
          ? pageApi.getJournalTitle(journalId)
          : recordRef
          ? pageApi.getRecordTitle(recordRef)
          : staticTitle(TITLE.HOMEPAGE);

        return prom.then(title => `${t(TITLE[URL.DASHBOARD_SETTINGS])} "${convertTitle(title)}"`);
      }
    },
    [PageTypes.BPMN_DESIGNER]: {
      getTitle: () => {
        return staticTitle(TITLE[URL.BPMN_DESIGNER]);
      }
    },
    [PageTypes.TIMESHEET]: {
      getTitle: () => {
        return staticTitle(TITLE.TIMESHEET);
      }
    }
  });

  /**
   *
   * @param link - string
   * @param params
   *    link - string,
   *    updateUrl - bool,
   *    openNewTab - bool,
   *    openNewBrowserTab - bool,
   *    reopenBrowserTab - bool,
   *    closeActiveTab - bool
   *    openInBackground - bool
   */
  static changeUrlLink = (link = '', params = {}) => {
    if (PageService.eventIsDispatched) {
      return;
    }

    PageService.eventIsDispatched = true;

    try {
      CHANGE_URL.params = { link, ...params };
      document.dispatchEvent(CHANGE_URL);
    } finally {
      PageService.eventIsDispatched = false;
    }
  };

  /**
   * Create link params from event & extra params || make the transition
   * @param event
   * @param linkIgnoreAttr
   * @returns {{link: string | undefined, isActive: boolean}} | undefined
   */
  static parseEvent = ({ event }) => {
    const { type, currentTarget, params } = event || {};
    const linkIgnoreAttr = IGNORE_TABS_HANDLER_ATTR_NAME;
    const currentLink = window.location.href.replace(window.location.origin, '');

    if (type === Events.CHANGE_URL_LINK_EVENT) {
      const { openNewTab, openNewBrowserTab, reopenBrowserTab, openInBackground, link, updateUrl, ...props } = params || {};

      event.preventDefault();

      if (updateUrl) {
        return {
          ...props,
          link,
          updates: { link }
        };
      }

      let target = '';

      if (openNewBrowserTab) {
        target = '_blank';
      } else if (reopenBrowserTab) {
        target = '_self';
      }

      if (target) {
        const tab = window.open(link, target);

        tab.focus();

        return;
      }

      PageService.setWhereLinkOpen({ parentLink: currentLink, subsidiaryLink: link });

      if (openInBackground) {
        return {
          ...props,
          link,
          isActive: false
        };
      }

      return {
        ...props,
        link,
        isActive: true,
        reopen: !openNewTab
      };
    }

    let elem = currentTarget;

    if ((!elem || elem.tagName !== LINK_TAG) && event.target) {
      elem = event.target.closest('a[href]');
    }

    if (!elem || elem.tagName !== LINK_TAG || !!elem.getAttribute(linkIgnoreAttr)) {
      return;
    }

    const link = decodeLink(elem.getAttribute(LINK_HREF));

    if (!link || !isNewVersionPage(link)) {
      return;
    }

    PageService.setWhereLinkOpen({ parentLink: currentLink, subsidiaryLink: link });

    event.preventDefault();

    const isBackgroundOpening = elem.getAttribute(OPEN_IN_BACKGROUND);

    return {
      link,
      isActive: !(isBackgroundOpening || (event.button === 0 && event.ctrlKey))
    };
  };

  static setWhereLinkOpen = ({ parentLink, subsidiaryLink }) => {
    if (isExistLocalStorage()) {
      const key = getKeyHistory();
      const history = getData(key) || {};
      const keyLink = PageService.keyId({ link: decodeLink(subsidiaryLink) });
      const parent = getLinkWithout({
        url: decodeLink(parentLink),
        ignored: [SearchKeys.PAGINATION, SearchKeys.FILTER, SearchKeys.SORT, SearchKeys.SHOW_PREVIEW]
      });

      if (!history[parent]) {
        history[parent] = [];
      }

      const found = history[parent].find(item => keyLink === item);

      if (found) {
        return;
      }

      history[parent].push(keyLink);

      setData(key, history);
    }
  };

  static extractWhereLinkOpen = ({ subsidiaryLink }) => {
    if (isExistLocalStorage()) {
      const key = getKeyHistory();
      const history = getData(key) || {};
      const keyLink = PageService.keyId({ link: decodeLink(subsidiaryLink) });

      for (const parentLink in history) {
        if (history.hasOwnProperty(parentLink)) {
          const parent = getLinkWithout({
            url: parentLink,
            ignored: [SearchKeys.PAGINATION, SearchKeys.FILTER, SearchKeys.SORT, SearchKeys.SHOW_PREVIEW]
          });
          const foundI = history[parent].findIndex(item => keyLink === item);

          if (!!~foundI) {
            history[parent].splice(foundI, 1);

            if (!history[parent].length) {
              delete history[parent];
            }

            setData(key, history);
            return parent;
          }
        }
      }
    }
  };
}

function staticTitle(keyTitle) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(t(keyTitle));
    }, 80);
  });
}

function getDefaultPage() {
  return Object.freeze({
    getTitle: () => staticTitle(TITLE.NO_NAME)
  });
}

function getKeyHistory() {
  return 'ecos-ui-transitions-history/v3/user-' + getCurrentUserName();
}

function convertTitle(title) {
  return t(title || TITLE.NO_NAME);
}
