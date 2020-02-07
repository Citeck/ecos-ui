import queryString from 'query-string';
import uuidv4 from 'uuid/v4';
import { decodeLink } from '../../helpers/urls';

export default class PageTab {
  #key;

  id;
  link;
  type;
  title;
  isActive;
  isLoading;

  constructor(data, params) {
    const { activeUrl } = params || {};
    let { type, link, title, id, isLoading = true, isActive = false } = data || {};

    link = decodeLink(link);

    if (activeUrl) {
      isActive = decodeLink(link) === decodeLink(activeUrl);
    }

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
    return {
      id: this.id,
      type: this.type,
      link: this.link
    };
  }

  static Types = {
    DASHBOARD: 'dashboard',
    JOURNALS: 'journals'
  };

  static getTypeFromUrl(url) {
    const urlProps = queryString.parseUrl(url);

    switch (true) {
      case urlProps.url.includes(PageTab.Types.DASHBOARD):
        return PageTab.Types.DASHBOARD;
      case urlProps.url.includes(PageTab.Types.JOURNALS):
        return PageTab.Types.JOURNALS;
    }
  }

  static getKeyFromUrl(url, type) {
    const urlProps = queryString.parseUrl(url);

    switch (type) {
      case PageTab.Types.DASHBOARD:
        return urlProps.query.recordRef || '';
      case PageTab.Types.JOURNALS:
        return urlProps.query.journalsListId || '';
    }
  }
}
