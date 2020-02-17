import queryString from 'query-string';
import uuidv4 from 'uuid/v4';
import { decodeLink } from '../../helpers/urls';

export const PageTypes = {
  DASHBOARD: 'dashboard',
  JOURNALS: 'journals',
  SETTINGS: 'dashboard/settings',
  BPMN_DESIGNER: 'bpmn-designer',
  TIMESHEET: 'timesheet'
};

/**
 * @define Describe One Application Tab
 * @param id {string} id view
 * @param link  {string} url
 * @param type {string} relation to the page
 * @param isActive {boolean} true = chosen tab
 * @param isLoading {boolean} true = getting data for tab
 *
 * @readonly
 * @private
 * @param key {string} key data from link
 *
 * @readonly
 * @uniqueKey {string} type + key
 * @storage {object} prepared data for local storage
 * @store {object} prepared data for local app store
 */
export default class PageTab {
  #key;

  id;
  link;
  type;
  title;
  isActive;
  isLoading;

  constructor(data) {
    let { type, link, title, id, isLoading = true, isActive = false } = data || {};

    link = decodeLink(link);

    this.id = id || `page-tab-${uuidv4()}`;
    this.link = link;
    this.type = type || PageTab.getTypeFromUrl(link);
    this.title = title;
    this.isLoading = isLoading;
    this.isActive = isActive;
    this.#key = PageTab.getKeyFromUrl(link, this.type);
  }

  get uniqueKey() {
    return `${this.type}-${this.#key}`;
  }

  get storage() {
    const { id, type, link } = this;

    return { id, type, link };
  }

  get store() {
    const { id, type, link, title, isActive, isLoading } = this;

    return { id, type, link, title, isActive, isLoading };
  }

  change(data) {
    for (const key in data) {
      if (data.hasOwnProperty(key) && this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    }
  }

  static getTypeFromUrl(url) {
    const urlProps = queryString.parseUrl(url);

    switch (true) {
      case urlProps.url.includes(PageTypes.SETTINGS):
        return PageTypes.SETTINGS;
      case urlProps.url.includes(PageTypes.DASHBOARD):
        return PageTypes.DASHBOARD;
      case urlProps.url.includes(PageTypes.JOURNALS):
        return PageTypes.JOURNALS;
      case urlProps.url.includes(PageTypes.BPMN_DESIGNER):
        return PageTypes.BPMN_DESIGNER;
      case urlProps.url.includes(PageTypes.TIMESHEET):
        return PageTypes.TIMESHEET;
      default:
        return '';
    }
  }

  static getKeyFromUrl(url, type) {
    const urlProps = queryString.parseUrl(url);

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
}
