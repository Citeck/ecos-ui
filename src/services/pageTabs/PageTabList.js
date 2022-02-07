import isArray from 'lodash/isArray';
import set from 'lodash/set';
import get from 'lodash/get';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import { EventEmitter2 } from 'eventemitter2';

import * as storage from '../../helpers/ls';
import { equalsQueryUrls, IgnoredUrlParams } from '../../helpers/urls';
import { t } from '../../helpers/util';
import { TITLE } from '../../constants/pageTabs';
import PageTab from './PageTab';
import PageService from '../PageService';

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
    return cloneDeep(this.#tabs || []);
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
    return this.tabs.find(item => item.isActive) || {};
  }

  get storageList() {
    return this.tabs.map(item => item.storage);
  }

  get storeList() {
    return this.tabs.map(item => item.store);
  }

  get activeTabId() {
    return get(this.activeTab, 'id', null);
  }

  get hasActiveTab() {
    return !isEmpty(this.#tabs.find(tab => tab.isActive));
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
    if (Array.isArray(tab)) {
      this.#deleteTabs(tab);
      return;
    }

    tab = tab.uniqueKey ? tab : new PageTab(tab);
    const tabIndex = this.#tabs.findIndex(item => this.equals(tab, item));

    if (tabIndex === -1 || this.#tabs.length < 2) {
      return;
    }

    const deletedTab = this.#tabs.splice(tabIndex, 1)[0];
    const length = this.#tabs.length;

    if (deletedTab.isActive && !!length) {
      const newIndex = tabIndex >= length ? length - 1 : tabIndex;
      this.activate(this.#tabs[newIndex]);
    }

    this.setToStorage();

    return deletedTab;
  }

  #deleteTabs = tabs => {
    const ids = tabs.map(tab => tab.id);

    this.#tabs = this.#tabs.filter(tab => !ids.includes(tab.id));
    this.setToStorage();
  };

  add(tab, indexTo = 0) {
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
        item.link = item.link.replace(window.location.origin, '');
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

  getValidList(tabs = this.#tabs) {
    tabs = isArray(tabs) ? tabs : [];

    if (!this.#isDuplicateAllowed) {
      tabs = tabs.reduce((result, item) => {
        const found = result.find(tab => PageTab.equals(tab, item));

        if (!found) {
          result.push(item);
        } else {
          found.isLoading = true;
        }

        return result;
      }, []);
    }

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

  isActiveTab = tabId => {
    if (!tabId) {
      return false;
    }

    return get(this.#tabs.find(tab => tab.id === tabId), 'isActive', false);
  };

  getTabById = tabId => {
    if (!tabId) {
      return null;
    }

    return find(this.#tabs, ['id', tabId]);
  };
}

const pageTabList = get(window, 'Citeck.PageTabList', new PageTabList());

export const updateTabEmitter = new EventEmitter2();

window.addEventListener('popstate', event => {
  const { href, origin } = get(event, 'target.location');
  const link = href.replace(origin, '');
  let tabs = cloneDeep(pageTabList.storeList);
  const founded = tabs.find(tab => PageTab.equals(tab, { link }));

  if (founded) {
    tabs.forEach(tab => {
      tab.isActive = tab.link === founded.link;
    });
  } else {
    const newTab = new PageTab({
      title: t(TITLE.LOADING),
      isLoading: true,
      isActive: true,
      link: window.encodeURIComponent(link)
    });

    tabs.forEach(tab => {
      tab.isActive = false;
    });

    try {
      const decodedLink = decodeURIComponent(link);
      const getTitle = PageService.getPage({ link: decodedLink }).getTitle({}, decodedLink);

      Promise.all([getTitle]).then(values => {
        newTab.title = values[0];
        newTab.isLoading = false;
        pageTabList.setTab(newTab);
        updateTabEmitter.emit('update');
      });
    } catch (e) {
      console.error('Update tab title filed: ', e.message);
    }

    tabs.push(newTab.store);
  }

  tabs = pageTabList.getValidList(tabs);

  pageTabList.tabs = { tabs, params: { openNewTab: true } };
  updateTabEmitter.emit('update');
});

set(window, 'Citeck.PageTabList', pageTabList);

export default pageTabList;
