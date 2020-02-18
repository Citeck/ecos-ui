import queryString from 'query-string';

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

    const regex = '/(?<=\\w\\/v2\\/).+(?=\\?\\w+)/g';
    const found = link.match(regex);

    return found ? found[0] : '';
  }

  static getKey(link, type) {
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
    link = link || window.location.href;
    type = type || PageService.getType(link);
    key = key || PageService.getKey(link, type);

    return `${type}-${key}`;
  }

  static getPage(type) {
    return PageService.pages[type];
  }

  static pages = Object.freeze({
    [PageTypes.DASHBOARD]: {
      getTitle: () => {}
    },
    [PageTypes.JOURNALS]: {
      getTitle: () => {}
    },
    [PageTypes.SETTINGS]: {
      getTitle: () => {}
    },
    [PageTypes.BPMN_DESIGNER]: {
      getTitle: () => {}
    },
    [PageTypes.TIMESHEET]: {
      getTitle: () => {}
    }
  });
}
