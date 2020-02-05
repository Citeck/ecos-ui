import PageTab from './PageTab';
import { PageTabsApi } from '../../api';
import { getCurrentUserName } from '../../helpers/util';

const api = new PageTabsApi();

class PageTabListService {
  #tabs = [];

  constructor() {
    this.#tabs = this.getAll();
  }

  get tabs() {
    return this.#tabs;
  }

  getAll() {
    api.checkOldVersion(getCurrentUserName());

    const tabs = api.getAll();
    console.log('here', tabs);
    return tabs.map(item => new PageTab(item));
  }

  add(data, params = {}) {
    const tab = new PageTab(data, params);

    if (this.isExist(tab.uniqueKey)) {
      this.#tabs.push(tab);
    }
  }

  delete(key) {
    const tabIndex = this.#tabs.findIndex(item => item.uniqueKey === key);

    this.#tabs.splice(tabIndex, 1);
  }

  isExist(key) {
    return this.#tabs.some(item => item.uniqueKey === key);
  }
}

window.Citeck = window.Citeck || {};
const PageTabList = (window.Citeck.PageTabList = window.Citeck.PageTabList || new PageTabListService());

export default PageTabList;
