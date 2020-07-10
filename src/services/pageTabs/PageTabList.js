import isArray from 'lodash/isArray';
import set from 'lodash/set';
import get from 'lodash/get';

import * as storage from '../../helpers/ls';
import { equalsQueryUrls, IgnoredUrlParams } from '../../helpers/urls';
import { t } from '../../helpers/util';
import { TITLE } from '../../constants/pageTabs';
import PageTab from './PageTab';

const exist = index => !!~index;

/**
 * @define Application Tabs Service (Singleton)
 * @readonly
 * @private
 * @param tabs {array} application tabs
 * @param keyStorage  {string} user key for local storage
 * @param displayState {boolean} true => show
 * @param customEvent {event} dispatch from anywhere you need
 */
class PageTabList {
  #tabs = [];
  #keyStorage;
  #displayState;
  #isDuplicateAllowed;
  #callbacks = [];

  get tabs() {
    return this.#tabs;
  }

  set tabs({ tabs = [], params = {} }) {
    this.#tabs = [];

    tabs = isArray(tabs) ? tabs : [];
    tabs.forEach(item => this.setTab(item, params));
  }

  set displayState(state) {
    this.#displayState = state;
  }

  get activeTab() {
    return this.#tabs.find(item => item.isActive) || {};
  }

  get storageList() {
    return this.#tabs.map(item => item.storage);
  }

  get storeList() {
    return this.#tabs.map(item => item.store);
  }

  get activeTabId() {
    return get(this.activeTab, 'id', null);
  }

  pushCallback = callback => {
    this.#callbacks.push(callback);
  };

  init({ activeUrl, keyStorage, isDuplicateAllowed, displayState, ...params }) {
    this.#keyStorage = keyStorage || this.#keyStorage;
    this.#displayState = !!displayState;
    this.#isDuplicateAllowed = !!isDuplicateAllowed;

    let tabs = this.getFromStorage();
    tabs = this.getValidList(tabs);

    params = { ...params, last: true };
    this.tabs = { tabs, params };

    if (!!activeUrl) {
      const newTab = { link: activeUrl, isActive: true };
      const tab = this.existTab(newTab);

      if (tab) {
        this.activate(tab);
      } else {
        this.setTab(newTab);
      }
    }

    this.#callbacks.forEach(callback => {
      callback({
        tabs: this.tabs,
        activeTab: this.activeTab,
        storeList: this.storeList,
        storageList: this.storageList,
        activeTabId: this.activeTabId
      });
    });
  }

  /**
   * Create new tab or recover exist by link and params
   * @param data {object} data for create Tab
   * @param params {object} extra condition info
   * @returns {PageTab}
   */
  setTab(data, params = {}) {
    const { last, reopen } = params;
    const tab = new PageTab({ title: t(TITLE.LOADING), isLoading: true, ...data });
    const currentTabIndex = this.existTabIndex(tab);
    const isExist = exist(currentTabIndex);

    if (isExist) {
      tab.id = this.#tabs[currentTabIndex].id;
    }

    if (reopen) {
      if (isExist) {
        this.delete(tab);
      }

      this.changeOne({ updates: tab, tab: this.activeTab });
    } else {
      const indexTo = this.getPlaceTab({ currentTabIndex, last });

      if (isExist) {
        const updates = {
          ...tab,
          isActive: this.equals(this.activeTab, tab) || tab.isActive
        };

        this.changeOne({ updates, tab });
        this.move(currentTabIndex, indexTo);
      } else {
        this.add(tab, indexTo);
      }
    }

    return tab;
  }

  activate(tab) {
    this.#tabs.forEach(item => {
      item.isActive = item.id === tab.id;
    });

    this.setToStorage();
  }

  /**
   * Delete tab and set next active
   * @param tab
   * @returns {PageTab | undefined}
   */
  delete(tab) {
    tab = tab.uniqueKey ? tab : new PageTab(tab);
    const tabIndex = this.#tabs.findIndex(item => this.equals(tab, item));

    if (tabIndex === -1 || this.#tabs.length < 2) {
      return;
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

    return deletedTab;
  }

  add(tab, indexTo) {
    this.#tabs.splice(indexTo, 0, tab);

    if (this.#tabs.length < 2) {
      tab.isActive = true;
    }

    if (tab.isActive) {
      this.activate(tab);
    }

    this.setToStorage();
  }

  changeOne({ tab, updates }) {
    let changingTab = null;

    tab = tab instanceof PageTab ? tab : new PageTab(tab);

    if (this.#tabs.length === 1) {
      updates.isActive = true;
    }

    this.#tabs.forEach(item => {
      if (this.equals(item, tab)) {
        item.change(updates);
        changingTab = item;
      }
    });

    if (updates.isActive) {
      this.activate(tab);
    }

    this.setToStorage();

    return changingTab;
  }

  move(indexFrom, indexTo) {
    const tab = this.#tabs.splice(indexFrom, 1)[0];
    indexTo = indexTo < 0 ? this.#tabs.length + indexTo : indexTo;

    this.#tabs.splice(indexTo, 0, tab);

    this.setToStorage();
  }

  existTabIndex(tab) {
    if (this.#isDuplicateAllowed) {
      return this.#tabs.findIndex(item => this.equalsLink(tab, item));
    }

    return this.#tabs.findIndex(item => this.equals(tab, item));
  }

  existTab(data) {
    const check = new PageTab(data);
    const i = this.existTabIndex(check);
    return exist(i) ? this.#tabs[i] : null;
  }

  equals(tab1, tab2) {
    return this.#isDuplicateAllowed ? tab1.link === tab2.link : tab1.uniqueKey === tab2.uniqueKey;
  }

  equalsLink(tab1, tab2) {
    return equalsQueryUrls({
      urls: [tab1.link, tab2.link],
      ignored: IgnoredUrlParams
    });
  }

  /**
   * Return index e.g. for move there
   * @param currentTabIndex
   * @param last - to make page last
   * @param reopen > change current page
   * @returns {*}
   */
  getPlaceTab({ currentTabIndex, last }) {
    const activeIndex = this.#tabs.findIndex(item => item.isActive);

    return last || !this.#tabs.length || !exist(activeIndex)
      ? this.#tabs.length
      : exist(currentTabIndex) && currentTabIndex <= activeIndex
      ? activeIndex
      : activeIndex + 1;
  }

  getValidList(tabs) {
    tabs = isArray(tabs) ? tabs : [];

    return tabs.filter(tab => tab.link);
  }

  setToStorage() {
    storage.setData(this.#keyStorage, this.storageList);
  }

  getFromStorage() {
    if (storage.hasData(this.#keyStorage, 'array')) {
      return storage.getData(this.#keyStorage);
    }
  }

  getTabById = id => {
    return this.#tabs.find(tab => tab.id === id) || {};
  };

  getTabByLink = (link = '') => {
    let url = link;

    if (!link.length) {
      url = window.location.pathname + window.location.search;
    }

    return this.#tabs.find(tab => tab.link === url) || {};
  };

  isActiveTab = tabId => {
    if (!tabId) {
      return false;
    }

    return get(this.#tabs.find(tab => tab.id === tabId), 'isActive', false);
  };
}

const pageTabList = get(window, 'Citeck.PageTabList', new PageTabList());

set(window, 'Citeck.PageTabList', pageTabList);

export default pageTabList;
