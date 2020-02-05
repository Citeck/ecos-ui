import queryString from 'query-string';
import uniqueId from 'lodash/uniqueId';

export default class PageTab {
  #id;
  #link;
  #type;
  #key;

  isActive;
  isLoading;
  title;

  constructor(info) {
    const { params, ...data } = info;
    const { type, url, title } = data;

    this.#id = uniqueId('page-tab-');
    this.#type = type;
    this.#key = PageTab.getKeyFromUrl(url);
    this.title = title;
    this.isLoading = false;
    this.isActive = false;
  }

  get uniqueKey() {
    return `${this.#type}-${this.#key}`;
  }

  get local() {
    return {
      id: this.#id,
      type: this.#type,
      link: this.#link
    };
  }

  static Types = {
    DASHBOARD: 'dashboard',
    JOURNALS: 'journals'
  };

  static getKeyFromUrl(url, type) {
    const urlProps = queryString.parse(url);

    switch (type) {
      case PageTab.Types.DASHBOARD:
        return urlProps.recordRef || '';
      case PageTab.Types.JOURNALS:
        return urlProps.journalsListId || '';
    }
  }
}
