import queryString from 'query-string';
import get from 'lodash/get';

import { URL } from '../constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME, LINK_HREF, LINK_TAG, OPEN_IN_BACKGROUND, TITLE } from '../constants/pageTabs';
import { SectionTypes } from '../constants/adminSection';
import { getCurrentUserName, t } from '../helpers/util';
import { decodeLink, getLinkWithout, IgnoredUrlParams, isNewVersionPage } from '../helpers/urls';
import { getData, isExistLocalStorage, setData } from '../helpers/ls';
import { PageApi } from '../api/page';

const pageApi = new PageApi();

export const PageTypes = {
  DASHBOARD: 'dashboard',
  JOURNALS: 'journals',
  SETTINGS: 'dashboard/settings',
  ADMIN_PAGE: 'admin',
  CMMN_EDITOR: 'cmmn-editor',
  DEV_TOOLS: 'dev-tools',
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
    let type = get(found, '[1]', '');

    if (type.indexOf(PageTypes.TIMESHEET) === 0) {
      return PageTypes.TIMESHEET;
    }

    return type;
  }

  static getKey({ link, type }) {
    const _link = link || window.location.href;
    const _type = type || PageService.getType(_link);
    const urlProps = queryString.parseUrl(_link);

    switch (_type) {
      case PageTypes.SETTINGS:
        return urlProps.query.dashboardId || '';
      case PageTypes.DASHBOARD:
      case PageTypes.CMMN_EDITOR:
        return urlProps.query.recordRef || '';
      case PageTypes.JOURNALS:
        return urlProps.query.journalId || '';
      default:
        return '';
    }
  }

  static getRef(link) {
    const _link = link || window.location.href;
    const _type = PageService.getType(_link);
    const urlProps = queryString.parseUrl(_link);

    switch (_type) {
      case PageTypes.SETTINGS:
      case PageTypes.DASHBOARD:
      case PageTypes.CMMN_EDITOR:
        return urlProps.query.recordRef || '';
      case PageTypes.JOURNALS:
        return urlProps.query.journalId || '';
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

    return PageService.pageTypes[_type] || getDefaultPage(link);
  }

  static pageTypes = Object.freeze({
    [PageTypes.DASHBOARD]: {
      getTitle: ({ recordRef }, link) => {
        if (!recordRef) {
          recordRef = PageService.getRef(link);
        }

        return recordRef ? pageApi.getRecordTitle(recordRef).then(title => convertTitle(title)) : staticTitle(TITLE.HOMEPAGE);
      }
    },
    [PageTypes.JOURNALS]: {
      getTitle: ({ journalId } = {}, link) => {
        if (!journalId) {
          journalId = PageService.getRef(link);
        }

        const prom = pageApi.getJournalTitle(journalId);

        return prom.then(title => `${t(TITLE.JOURNAL)} "${convertTitle(title)}"`);
      }
    },
    [PageTypes.SETTINGS]: {
      getTitle: ({ recordRef, journalId }) => {
        const promise = journalId
          ? pageApi.getJournalTitle(journalId)
          : recordRef
          ? pageApi.getRecordTitle(recordRef)
          : staticTitle(TITLE.HOMEPAGE);

        return promise.then(title => `${t(TITLE[URL.DASHBOARD_SETTINGS])} "${convertTitle(title)}"`);
      }
    },
    [PageTypes.TIMESHEET]: {
      getTitle: () => staticTitle(TITLE.TIMESHEET)
    },
    [PageTypes.DEV_TOOLS]: {
      getTitle: () => staticTitle(TITLE[URL.DEV_TOOLS])
    },
    [PageTypes.ADMIN_PAGE]: {
      getTitle: ({ type, journalId }) => {
        if (journalId && type === SectionTypes.JOURNAL) {
          return PageService.pageTypes[PageTypes.JOURNALS].getTitle({ journalId });
        }

        if (type === SectionTypes.BPM) {
          return staticTitle(TITLE.BPM);
        }

        return staticTitle(TITLE.ADMIN_PAGE);
      }
    },
    [PageTypes.CMMN_EDITOR]: {
      getTitle: ({ recordRef }) => pageApi.getRecordTitle(recordRef).then(title => `${t(TITLE[URL.CMMN_EDITOR])} "${convertTitle(title)}"`)
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
   *    closeActiveTab - bool,
   *    openInBackground - bool,
   *    pushHistory - bool,
   *    replaceHistory - bool // default true, if updateUrl is true
   *    rerenderPage - bool, needed to replace link in the router and start rerendering page
   */
  static changeUrlLink = (link = '', params = {}) => {
    if (PageService.eventIsDispatched) {
      return;
    }

    PageService.eventIsDispatched = true;

    try {
      CHANGE_URL.params = { link: decodeLink(link), ...params };
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

    const modalParent = elem.closest('.ecos-modal');
    if (modalParent) {
      elem.setAttribute('target', '_blank');
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
        ignored: IgnoredUrlParams
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
          const source = history[parentLink] || [];
          const index = source.findIndex(item => keyLink === item);
          const isFound = index >= 0;

          isFound && source.splice(index, 1);

          if (!source.length) {
            delete history[parentLink];
            setData(key, history);
          }

          if (isFound) {
            return getLinkWithout({ url: parentLink, ignored: IgnoredUrlParams });
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

function getDefaultPage(link) {
  return Object.freeze({
    getTitle: () => staticTitle(TITLE[link] || TITLE.NO_NAME)
  });
}

function getKeyHistory() {
  return 'ecos-ui-transitions-history/v3/user-' + getCurrentUserName();
}

function convertTitle(title) {
  return t(title || TITLE.NO_NAME);
}
