import isArray from 'lodash/isArray';

import * as storage from '../../helpers/ls';
import { decodeLink } from '../../helpers/urls';
import { t } from '../../helpers/util';
import { TITLE } from '../../constants/pageTabs';
import PageTab from './PageTab';

class PageTabListService {
  #tabs;
  #keyStorage;
  #customEvent;

  events = {
    CHANGE_URL_LINK_EVENT: 'CHANGE_URL_LINK_EVENT'
  };

  constructor() {
    this.#tabs = [];
    this.#customEvent = document.createEvent('Event');
    this.#customEvent.initEvent(this.events.CHANGE_URL_LINK_EVENT, true, true);
  }

  get tabs() {
    return this.#tabs;
  }

  set tabs({ tabs, params = {} }) {
    this.#tabs = [];

    tabs = isArray(tabs) ? tabs : [];
    tabs.forEach(item => this.add(item, params));
  }

  get isActive() {
    return this.#tabs.find(item => item.isActive);
  }

  get storageList() {
    return this.#tabs.map(item => item.storage);
  }

  get storeList() {
    return this.#tabs.map(item => item.store);
  }

  init({ params, keyStorage }) {
    this.#keyStorage = keyStorage || this.#keyStorage;

    const tabs = this.getFromStorage();

    this.tabs = { tabs, params };

    if (!!params.activeUrl) {
      this.add({ link: params.activeUrl }, params);
    }
  }

  updateAll({ tabs, params = {} }) {
    this.tabs = { tabs, params };
    this.setToStorage();
  }

  add(data, params = {}) {
    const tab = new PageTab({ title: t(TITLE.LOADING), ...data }, params);

    if (!this.isTabExist(tab.uniqueKey)) {
      this.#tabs.push(tab);
    }

    if (data.isActive || tab.link === decodeLink(params.activeUrl)) {
      this.activate(tab);
    }

    this.setToStorage();

    return tab;
  }

  activate(tab) {
    this.#tabs.forEach(item => {
      item.isActive = item.uniqueKey === tab.uniqueKey;
    });

    this.setToStorage();
  }

  delete(tab) {
    const tabIndex = this.#tabs.findIndex(item => item.uniqueKey === tab.uniqueKey || item.id === tab.id);

    if (tabIndex === -1) {
      return false;
    }

    const deletedTab = this.#tabs.splice(tabIndex, 1)[0];
    const length = this.#tabs.length;

    if (deletedTab.isActive && !!length) {
      if (tabIndex >= length) {
        this.#tabs[length - 1].isActive = true;
      } else {
        this.#tabs[tabIndex].isActive = true;
      }
    }

    this.setToStorage();
  }

  changeOne({ data, key }) {
    let changingTab = null;

    this.#tabs.forEach(item => {
      if (item.uniqueKey === key) {
        item.change(data);
        changingTab = item;
      }
    });

    this.setToStorage();

    return changingTab;
  }

  move(indexFrom, indexTo) {
    this.#tabs.splice(indexTo < 0 ? this.#tabs.length + indexTo : indexTo, 0, this.#tabs.splice(indexFrom, 1)[0]);

    this.setToStorage();
  }

  setToStorage() {
    storage.setData(this.#keyStorage, this.storageList);
  }

  getFromStorage() {
    if (storage.hasData(this.#keyStorage, 'array')) {
      return storage.getData(this.#keyStorage);
    }
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
    this.#customEvent.params = { link, ...params };
    document.dispatchEvent(this.#customEvent);
  };
}

window.Citeck = window.Citeck || {};

const PageTabList = (window.Citeck.PageTabList = window.Citeck.PageTabList || new PageTabListService());

export default PageTabList;
