import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import get from 'lodash/get';

import * as storage from '../../helpers/ls';
import { decodeLink, isNewVersionPage } from '../../helpers/urls';
import { t } from '../../helpers/util';
import { LINK_HREF, LINK_TAG, OPEN_IN_BACKGROUND, TITLE } from '../../constants/pageTabs';
import PageTab from './PageTab';

/**
 * @define Application Tabs Service (Singleton)
 * @readonly
 * @private
 * @param tabs {array} application tabs
 * @param keyStorage  {string} user key for local storage
 * @param displayState {boolean} true = show
 * @param customEvent {event} dispatch from anywhere you need
 */
class PageTabListService {
  #tabs;
  #keyStorage;
  #displayState;
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

  set tabs({ tabs = [], params = {} }) {
    this.#tabs = [];

    tabs = isArray(tabs) ? tabs : [];
    tabs.forEach(item => this.add(item, params));
  }

  set displayState(state) {
    this.#displayState = state;
  }

  get isActiveTab() {
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
    const activeTab = !!params.activeUrl && { link: params.activeUrl };

    let tabs = this.getFromStorage();

    if (isEmpty(tabs) && activeTab) {
      tabs = [activeTab];
    }

    this.tabs = { tabs, ...params, last: true };

    if (activeTab) {
      const tab = this.getVerifiableTab(activeTab);

      this.activate(tab);
    }
  }

  updateAll({ tabs, params = {} }) {
    this.tabs = { tabs, params };
    this.setToStorage();
  }

  /**
   * Create new tab or recover exist by link and params
   * @param data {object} data for create Tab
   * @param params {object} extra condition info
   * @returns {PageTab}
   */
  add(data, params = {}) {
    const { last } = params;
    const tab = new PageTab({ title: t(TITLE.LOADING), isLoading: true, ...data });
    const newTabIndex = this.existTabIndex(tab.uniqueKey);
    const indexTo = this.getPlaceTab(newTabIndex, last);

    if (!!~newTabIndex) {
      this.changeOne({ data: tab, key: tab.uniqueKey });
      this.move(newTabIndex, indexTo);
    } else {
      this.#tabs.splice(indexTo, 0, tab);
      this.setToStorage();
    }

    if (data.isActive || tab.link === decodeLink(params.activeUrl)) {
      this.activate(tab);
    }

    return tab;
  }

  activate(tab) {
    this.#tabs.forEach(item => {
      item.isActive = item.uniqueKey === tab.uniqueKey;
    });

    this.setToStorage();
  }

  /**
   * Delete tab and set next active
   * @param tab
   * @returns {PageTab | undefined}
   */
  delete(tab) {
    tab = tab.uniqueKey ? tab : this.getVerifiableTab(tab);
    const tabIndex = this.#tabs.findIndex(item => item.uniqueKey === tab.uniqueKey);

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
    const tab = this.#tabs.splice(indexFrom, 1)[0];
    indexTo = indexTo < 0 ? this.#tabs.length + indexTo : indexTo;

    this.#tabs.splice(indexTo, 0, tab);

    this.setToStorage();
  }

  existTabIndex(key) {
    return this.#tabs.findIndex(item => item.uniqueKey === key);
  }

  /**
   * Return index e.g. for move there
   * @param currentTabIndex
   * @param last
   * @returns {*}
   */
  getPlaceTab(currentTabIndex, last) {
    const activeIndex = this.#tabs.findIndex(item => item.isActive);

    return !!this.#tabs.length && !last && !!~activeIndex
      ? !!~currentTabIndex && currentTabIndex <= activeIndex
        ? activeIndex
        : activeIndex + 1
      : this.#tabs.length;
  }

  /**
   * Create test tab e.g. for check tab exist
   * @param data
   * @returns {PageTab}
   */
  getVerifiableTab(data) {
    return new PageTab(data);
  }

  setToStorage() {
    storage.setData(this.#keyStorage, this.storageList);
  }

  getFromStorage() {
    if (storage.hasData(this.#keyStorage, 'array')) {
      return storage.getData(this.#keyStorage);
    }
  }

  /**
   *
   * @param link - string
   * @param params
   *    link - string,
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

  defineProps = ({ event, linkIgnoreAttr }) => {
    const { type, currentTarget, params } = event || {};

    if (type === this.events.CHANGE_URL_LINK_EVENT) {
      const { openNewTab, openNewBrowserTab, reopenBrowserTab, closeActiveTab, link = '' } = params || {};

      if (closeActiveTab) {
        this.delete(this.isActiveTab);
      }

      event.preventDefault();

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

      return {
        link,
        isActive: openNewTab
      };
    }

    let elem = currentTarget;

    if ((!elem || elem.tagName !== LINK_TAG) && event.target) {
      elem = event.target.closest('a[href]');
    }

    if (!elem || elem.tagName !== LINK_TAG || !!elem.getAttribute(linkIgnoreAttr)) {
      return;
    }

    const link = decodeLink(elem.getAttribute(LINK_HREF));

    if (!link || !isNewVersionPage(link)) {
      return;
    }

    event.preventDefault();

    const isBackgroundOpening = elem.getAttribute(OPEN_IN_BACKGROUND);

    return {
      link,
      isActive: !(isBackgroundOpening || (event.button === 0 && event.ctrlKey))
    };
  };
}

const PageTabList = get(window, 'Citeck.PageTabList', new PageTabListService());

set(window, 'Citeck.PageTabList', PageTabList);

export default PageTabList;
