import isArray from 'lodash/isArray';
import PageTab from './PageTab';

class PageTabListService {
  #tabs = [];

  customEvent = document.createEvent('Event');

  events = {
    CHANGE_URL_LINK_EVENT: 'CHANGE_URL_LINK_EVENT'
  };

  get tabs() {
    return this.#tabs;
  }

  set tabs({ tabs, params }) {
    tabs = isArray(tabs) ? tabs : [];
    this.#tabs = [];
    tabs.forEach(item => this.add(item, params));
  }

  get storageList() {
    return this.#tabs.map(item => item.storage);
  }

  init({ tabs, params }) {
    this.tabs = { tabs, params };

    if (!!params.activeUrl) {
      this.add({ link: params.activeUrl }, params);
    }
  }

  add(data, params) {
    const tab = new PageTab(data, params);

    if (!this.isTabExist(tab.uniqueKey)) {
      this.#tabs.push(tab);
    }
  }

  delete(key) {
    const tabIndex = this.#tabs.findIndex(item => item.uniqueKey === key);

    this.#tabs.splice(tabIndex, 1);
  }

  isTabExist(key) {
    return this.#tabs.some(item => item.uniqueKey === key);
  }

  /**
   *
   * @param link - string
   * @param params
   *    checkUrl - bool,
   *    openNewTab - bool,
   *    openNewBrowserTab - bool,
   *    reopenBrowserTab - bool,
   *    closeActiveTab - bool
   *    openInBackground - bool
   */
  changeUrlLink = (link = '', params = {}) => {
    this.customEvent.params = { link, ...params };
    document.dispatchEvent(this.customEvent);
  };
}

window.Citeck = window.Citeck || {};

const PageTabList = (window.Citeck.PageTabList = window.Citeck.PageTabList || new PageTabListService());

export default PageTabList;
