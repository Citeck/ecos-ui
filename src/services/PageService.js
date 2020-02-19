import queryString from 'query-string';
import get from 'lodash/get';

import { t } from '../helpers/util';
import { TITLE } from '../constants/pageTabs';
import { URL } from '../constants';
import { PageApi } from '../api';

const pageApi = new PageApi();

export const PageTypes = {
  DASHBOARD: 'dashboard',
  JOURNALS: 'journals',
  SETTINGS: 'dashboard/settings',
  BPMN_DESIGNER: 'bpmn-designer',
  TIMESHEET: 'timesheet'
};

export default class PageService {
  static getType(link) {
    link = link || window.location.href;
    const found = queryString.parseUrl(link).url.split('/v2/');

    return get(found, '[1]', '');
  }

  static getKey({ link, type }) {
    link = link || window.location.href;
    type = type || PageService.getType(link);

    const urlProps = queryString.parseUrl(link);

    switch (type) {
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
    type = type || PageService.getType(link);
    key = key || PageService.getKey({ link, type });

    return `${type}-${key}`;
  }

  static getPage({ link, type }) {
    type = type || PageService.getType(link);

    return PageService.pages[type] || getDefaultPage();
  }

  static pages = Object.freeze({
    [PageTypes.DASHBOARD]: {
      getTitle: ({ recordRef }) => {
        return recordRef ? pageApi.getRecordTitle(recordRef) : staticTitle(TITLE.HOMEPAGE);
      }
    },
    [PageTypes.JOURNALS]: {
      getTitle: ({ journalId }) => {
        return pageApi.getJournalTitle(journalId);
      }
    },
    [PageTypes.SETTINGS]: {
      getTitle: ({ recordRef, journalId }) => {
        const prom = recordRef ? pageApi.getRecordTitle(recordRef) : pageApi.getJournalTitle(journalId);

        return prom.then(title => `${t(TITLE[URL.DASHBOARD_SETTINGS])} ${title}`);
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
