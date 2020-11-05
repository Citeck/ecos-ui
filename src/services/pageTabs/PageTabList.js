import isArray from 'lodash/isArray';
import set from 'lodash/set';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { EventEmitter2 } from 'eventemitter2';

import * as storage from '../../helpers/ls';
import { decodeLink, equalsQueryUrls, IgnoredUrlParams } from '../../helpers/urls';
import { t } from '../../helpers/util';
import { TITLE } from '../../constants/pageTabs';
import PageTab from './PageTab';
import PageService from '../PageService';

const exist = index => !!~index;
let _prevPage = '';

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
    this.#tabs = tabs.map(item => this.setTab(item, params));
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

export const updateTabEmitter = new EventEmitter2();

window.addEventListener('popstate', event => {
  const { href, origin } = get(event, 'target.location');
  const link = href.replace(origin, '');
  const exist = pageTabList.existTab({ link });
  const prevTab = pageTabList.existTab({ link: _prevPage });
  const activeTab = cloneDeep({ ...pageTabList.activeTab, isActive: false });
  const tabs = cloneDeep(pageTabList.storeList);

  console.warn({
    activeTab,
    current: pageTabList.activeTab.link,
    _prevPage,
    link,
    prevTab,
    tabs
  });

  const founded = tabs.find(tab => tab.link === decodeLink(link));

  console.warn({ founded }, link, decodeLink(link));

  if (founded) {
    tabs.forEach(tab => {
      tab.isActive = tab.link === decodeLink(link);
    });
  } else {
    const newTab = new PageTab({ title: t(TITLE.LOADING), isLoading: true, link: window.encodeURIComponent(link) });

    tabs.push(newTab.store);

    console.warn(newTab);
  }

  // pageTabList.setTab({ link }, { openNewTab: true, closeActiveTab: true });

  // if (exist) {
  //   pageTabList.activate(exist);
  //   pageTabList.setTab(activeTab);
  //
  // } else {
  //   pageTabList.setTab({ link }, { openNewTab: true, closeActiveTab: true });
  // }

  // activeTab.link = link;
  //
  // pageTabList.setTab(activeTab, { reopen: true });

  // PageService.changeUrlLink(link, { openNewTab: true });

  console.warn({
    event,
    // href,
    // origin,
    link,
    // activeTab,
    current: window.location.href,
    // newTab,
    exist,
    tabs,
    // tabs: pageTabList.tabs,
    prev: event.srcElement.location.href
    // normalized: pageTabList.getValidList(pageTabList.tabs)
  });

  _prevPage = link;
  pageTabList.tabs = { tabs, params: { openNewTab: true } };
  updateTabEmitter.emit('update');

  console.warn(cloneDeep(pageTabList.storeList));
});

set(window, 'Citeck.PageTabList', pageTabList);

window.history.pushState = function(params) {
  const { href, origin } = get(window, 'location', {});
  let link = get(params, 'path');

  if (!link) {
    link = href.replace(origin, '');
  }

  if (link !== href.replace(origin, '')) {
    _prevPage = link;
  }

  console.warn('pushState', link, params);
  History.prototype.pushState.apply(window.history, arguments);
};

window.history.replaceState = function(params) {
  const { href, origin } = get(window, 'location', {});
  let link = get(params, 'path');

  if (!link) {
    link = href.replace(origin, '');
  }

  if (link !== href.replace(origin, '')) {
    _prevPage = link;
  }

  console.warn('replaceState', link, params);
  History.prototype.replaceState.apply(window.history, arguments);
};

export default pageTabList;
