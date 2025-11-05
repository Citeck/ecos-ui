import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import queryString from 'query-string';

import { PageApi } from '@/api/page';
import Records from '@/components/Records';
import { SourcesId, URL } from '@/constants';
import { SectionTypes } from '@/constants/adminSection';
import { IGNORE_TABS_HANDLER_ATTR_NAME, LINK_HREF, LINK_TAG, OPEN_IN_BACKGROUND, TITLE } from '@/constants/pageTabs';
import { getData, isExistLocalStorage, setData } from '@/helpers/ls';
import {
  decodeLink,
  getLinkWithout,
  getLinkWithWs,
  getSearchParams,
  getWorkspaceId,
  IgnoredUrlParams,
  isNewVersionPage
} from '@/helpers/urls';
import { getCurrentUserName, getEnabledWorkspaces, getMLValue, t } from '@/helpers/util';

const pageApi = new PageApi();

export const PageTypes = {
  DASHBOARD: 'dashboard',
  JOURNALS: 'journals',
  ADMIN_PAGE: 'admin',
  BPMN_ADMIN_PROCESS: 'bpmn-process',
  BPMN_ADMIN_INSTANCE: 'bpmn-instance',
  BPMN_MIGRATION: 'bpmn-migration',
  BPMN_EDITOR: 'bpmn-editor',
  CMMN_EDITOR: 'cmmn-editor',
  DMN_EDITOR: 'dmn-editor',
  BPMN_DESIGNER: 'bpmn-designer',
  ORGSTRUCTURE: 'orgstructure',
  DEV_TOOLS: 'dev-tools',
  TIMESHEET: 'timesheet'
};

export const Events = {
  CHANGE_URL_LINK_EVENT: 'CHANGE_URL_LINK_EVENT'
};

const CHANGE_URL = document.createEvent('Event');
CHANGE_URL.initEvent(Events.CHANGE_URL_LINK_EVENT, true, true);

const TYPES = {
  TYPE: 'emodel/type@type',
  BOARD: 'emodel/type@board',
  FORM: 'emodel/type@form',
  JOURNAL: 'emodel/type@journal'
};

const TYPE_TITLES = {
  [TYPES.TYPE]: TITLE.TYPE,
  [TYPES.BOARD]: TITLE.BOARD,
  [TYPES.JOURNAL]: TITLE.JOURNAL,
  [TYPES.FORM]: TITLE.FORM
};

export default class PageService {
  static eventIsDispatched = false;
  static beforeUrlChangeGuards = [];

  static getType(link) {
    const _link = link || window.location.href;
    const found = queryString.parseUrl(_link).url.split('/v2/');
    let type = get(found, '[1]', '');

    if (!type) {
      return PageTypes.DASHBOARD;
    }

    if (type.indexOf(PageTypes.ORGSTRUCTURE) === 0) {
      return PageTypes.ORGSTRUCTURE;
    }

    if (type.indexOf(PageTypes.TIMESHEET) === 0) {
      return PageTypes.TIMESHEET;
    }

    if (type.indexOf(PageTypes.BPMN_EDITOR) === 0) {
      return PageTypes.BPMN_EDITOR;
    }

    if (type.indexOf(PageTypes.DMN_EDITOR) === 0) {
      return PageTypes.DMN_EDITOR;
    }

    if (type.indexOf(PageTypes.BPMN_MIGRATION) === 0) {
      return PageTypes.BPMN_MIGRATION;
    }

    if (type.indexOf(PageTypes.BPM_ADMIN) === 0) {
      return PageTypes.BPM_ADMIN;
    }

    if (type.indexOf(PageTypes.BPMN_ADMIN_INSTANCE) === 0) {
      return PageTypes.BPMN_ADMIN_INSTANCE;
    }

    if ([PageTypes.BPMN_DESIGNER, PageTypes.DEV_TOOLS].includes(type)) {
      return PageTypes.ADMIN_PAGE;
    }

    return type;
  }

  static getKey({ link, type }) {
    const _link = link || window.location.href;
    let _type = type || PageService.getType(_link);
    const urlProps = queryString.parseUrl(_link);

    const enabledWorkspaces = getEnabledWorkspaces();
    const splitter = '?';
    if (_type === PageTypes.ADMIN_PAGE && enabledWorkspaces && _link.includes(splitter)) {
      const { type: adminType } = getSearchParams(splitter + _link.split('?')[1]);
      if (adminType) {
        switch (adminType) {
          case SectionTypes.JOURNAL:
            _type = PageTypes.JOURNALS;
            break;

          default:
            _type = adminType;
            break;
        }
      }
    }

    switch (_type) {
      case PageTypes.DASHBOARD:
      case PageTypes.CMMN_EDITOR:
      case PageTypes.BPMN_EDITOR:
      case PageTypes.DMN_EDITOR:
      case PageTypes.BPMN_ADMIN_PROCESS:
      case PageTypes.BPMN_ADMIN_INSTANCE:
        return urlProps.query.recordRef || '';
      case PageTypes.JOURNALS:
        return urlProps.query.journalId || '';
      case PageTypes.BPMN_DESIGNER:
      case PageTypes.DEV_TOOLS:
        return PageTypes.ADMIN_PAGE;

      // To save a tab using a unique key in the admin area (when enabled workspaces)
      case SectionTypes.DEV_TOOLS:
        return SectionTypes.DEV_TOOLS;
      case SectionTypes.DMN:
        return SectionTypes.DMN;
      case SectionTypes.BPM:
        return SectionTypes.BPM;
      case SectionTypes.BPMN_ADMIN:
        return SectionTypes.BPMN_ADMIN;

      default:
        if (enabledWorkspaces && _type === PageTypes.ADMIN_PAGE) {
          return SectionTypes.DEV_TOOLS;
        }

        return '';
    }
  }

  static getRef(link) {
    const _link = link || window.location.href;
    const _type = PageService.getType(_link);
    const urlProps = queryString.parseUrl(_link);

    switch (_type) {
      case PageTypes.DASHBOARD:
        const { recordRef = '' } = urlProps.query;

        return isArray(recordRef) ? recordRef.shift() : recordRef;
      case PageTypes.CMMN_EDITOR:
        return urlProps.query.recordRef || '';
      case PageTypes.JOURNALS:
        return urlProps.query.journalId || '';
      default:
        return '';
    }
  }

  static keyId({ link, type, key, workspace: wsId }) {
    const _type = type || PageService.getType(link);
    const _key = key || PageService.getKey({ link, type });
    const _wsId = wsId || getWorkspaceId();

    if (getEnabledWorkspaces()) {
      const [source, value] = _key.split('@');

      if (source.includes('wiki')) {
        return `${_type}-wiki-${_wsId}`;
      }

      return `${_type}-${_key}-${_wsId}`;
    }

    return `${_type}-${_key}`;
  }

  static getPage({ link, type }) {
    const _type = type || PageService.getType(link);

    return PageService.pageTypes[_type] || getDefaultPage(link);
  }

  static getTypeTitle(recordRef, typeTitle) {
    return pageApi.getRecordTitle(recordRef).then(title => `${t(typeTitle)} "${convertTitle(title)}"`);
  }

  static async getDashboardTitle(recordRef, dashboardId) {
    if (dashboardId) {
      const displayName = await Records.get(dashboardId).load('name');

      return `${t('menu-item.type.dashboard')} "${displayName ? getMLValue(displayName) : t(TITLE.NO_NAME)}"`;
    }
    if (!recordRef) {
      return staticTitle(TITLE.HOMEPAGE);
    }
    const type = await Records.get(recordRef).load('_type?id');
    const title = TYPE_TITLES[type];
    if (title) {
      return PageService.getTypeTitle(recordRef, title);
    }

    return pageApi.getRecordTitle(recordRef).then(convertTitle);
  }

  static isTypeRecord = recordRef => isString(recordRef) && recordRef.indexOf(SourcesId.TYPE) === 0;

  static pageTypes = Object.freeze({
    [PageTypes.DASHBOARD]: {
      getTitle: ({ dashboardId, recordRef }, link) => {
        if (!recordRef) {
          recordRef = PageService.getRef(link);
        }
        return PageService.getDashboardTitle(recordRef, dashboardId);
      }
    },
    [PageTypes.JOURNALS]: {
      getTitle: ({ journalId, force } = {}, link) => {
        if (!journalId) {
          journalId = PageService.getRef(link);
        }

        return pageApi.getJournalTitle(journalId, force).then(title => `${t(TITLE.JOURNAL)} "${convertTitle(title)}"`);
      }
    },
    [PageTypes.TIMESHEET]: {
      getTitle: () => staticTitle(TITLE.TIMESHEET)
    },
    [PageTypes.ORGSTRUCTURE]: {
      getTitle: () => staticTitle(TITLE.ORGSTRUCTURE)
    },
    [PageTypes.DEV_TOOLS]: {
      getTitle: () => staticTitle(TITLE[URL.DEV_TOOLS])
    },
    [PageTypes.BPMN_MIGRATION]: {
      getTitle: () => staticTitle(TITLE[URL.BPMN_MIGRATION])
    },
    [PageTypes.ADMIN_PAGE]: {
      getTitle: ({ type, journalId }) => {
        if (journalId && type === SectionTypes.JOURNAL) {
          return PageService.pageTypes[PageTypes.JOURNALS].getTitle({ journalId });
        }

        if (type === SectionTypes.BPM) {
          return staticTitle(TITLE.BPM);
        }

        if (type === SectionTypes.DMN) {
          return staticTitle(TITLE.DMN);
        }

        if (type === SectionTypes.BPMN_ADMIN) {
          return staticTitle(TITLE.BPM_ADMIN);
        }

        return staticTitle(TITLE.ADMIN_PAGE);
      }
    },
    [PageTypes.BPMN_ADMIN_PROCESS]: {
      getTitle: ({ recordRef }) =>
        pageApi.getRecordTitle(recordRef).then(title => `${t(TITLE[URL.BPMN_ADMIN_PROCESS])} "${convertTitle(title)}"`)
    },
    [PageTypes.BPMN_ADMIN_INSTANCE]: {
      getTitle: ({ recordRef }) =>
        pageApi.getRecordTitle(recordRef).then(title => `${t(TITLE[URL.BPMN_ADMIN_INSTANCE])} "${convertTitle(title)}"`)
    },
    [PageTypes.DMN_EDITOR]: {
      getTitle: ({ recordRef }) => pageApi.getRecordTitle(recordRef).then(title => `${t(TITLE[URL.DMN_EDITOR])} "${convertTitle(title)}"`)
    },
    [PageTypes.BPMN_EDITOR]: {
      getTitle: ({ recordRef }) => pageApi.getRecordTitle(recordRef).then(title => `${t(TITLE[URL.BPMN_EDITOR])} "${convertTitle(title)}"`)
    },
    [PageTypes.CMMN_EDITOR]: {
      getTitle: ({ recordRef }) => pageApi.getRecordTitle(recordRef).then(title => `${t(TITLE[URL.CMMN_EDITOR])} "${convertTitle(title)}"`)
    }
  });

  /**
   * Change Link
   * @param link {string}
   * @param params {Object}
   * @description for params:
   *    link {string},
   *    updateUrl {boolean},
   *    openNewTab {boolean},
   *    openNewBrowserTab {boolean},
   *    reopenBrowserTab {boolean},
   *    closeActiveTab {boolean},
   *    openInBackground {boolean},
   *    pushHistory {boolean},
   *    replaceHistory {boolean} - default true, if updateUrl is true
   *    rerenderPage {boolean} - needed to replace link in the router and start rerendering page
   */
  static changeUrlLink = (link = '', params = {}) => {
    if (PageService.eventIsDispatched) {
      return;
    }

    PageService.eventIsDispatched = true;

    try {
      const fullParams = { link: decodeLink(link), ...params };
      CHANGE_URL.params = fullParams;

      if (this.beforeUrlChangeGuards.length) {
        this.beforeUrlChangeGuards
          .reduce((prevP, guard) => {
            return prevP.then(() =>
              Promise.resolve(guard.fn(fullParams, guard.tabId || null)).then(result => {
                if (result === false) {
                  throw new Error('__GUARD_CANCEL__');
                }
                return;
              })
            );
          }, Promise.resolve())
          .then(() => {
            document.dispatchEvent(CHANGE_URL);
          })
          .catch(err => {
            if (err && err.message === '__GUARD_CANCEL__') {
              return;
            }
            console.error('guard chain error:', err);
          });

        return;
      }

      document.dispatchEvent(CHANGE_URL);
    } finally {
      PageService.eventIsDispatched = false;
    }
  };

  /** Prevents history changes. Allows controlling when the history should change using a promise-based function
   * @param guardFn {function(*): Promise<unknown>}
   * @param tabId {string}
   **/
  static registerUrlChangeGuard(guardFn, tabId) {
    // To avoid duplication of promises, it is necessary to give the same link to the function!
    const exists = !!PageService.beforeUrlChangeGuards.find(guard => guard.fn === guardFn || (tabId && guard.tabId === tabId));
    if (!exists) {
      PageService.beforeUrlChangeGuards.push({ fn: guardFn, tabId });
    }
  }

  static clearUrlChangeGuards() {
    PageService.beforeUrlChangeGuards = [];
  }

  static clearUrlChangeGuard(tabId) {
    if (!isNil(tabId)) {
      PageService.beforeUrlChangeGuards = PageService.beforeUrlChangeGuards.filter(value => value.tabId !== tabId);
    }
  }

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
        let tab;

        if (getEnabledWorkspaces() && window.location.href.includes('ws=') && link && !link.includes('ws=')) {
          const url = new URLSearchParams(window.location.search);
          const wsId = url.get('ws');

          tab = window.open(getLinkWithWs(link, wsId), target);
        } else {
          tab = window.open(link, target);
        }

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
  return new Promise(resolve => {
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
