import { CommonApi } from './common';
import { generateSearchTerm } from '../helpers/util';
import { PROXY_URI } from '../constants/alfresco';

export class MenuApi extends CommonApi {
  getCreateVariantsForAllSites = () => {
    const url = `${PROXY_URI}api/journals/create-variants/site/ALL`;
    return this.getJson(url).catch(() => []);
  };

  getLiveSearchDocuments = (terms, startIndex) => {
    const url = `${PROXY_URI}slingshot/live-search-docs?t=${generateSearchTerm(terms)}&maxResults=5&startIndex=${startIndex}`;
    return this.getJson(url);
  };

  getLiveSearchSites = terms => {
    const url = `${PROXY_URI}slingshot/live-search-sites?t=${generateSearchTerm(terms)}&maxResults=5`;
    return this.getJson(url);
  };

  getLiveSearchPeople = terms => {
    const url = `${PROXY_URI}slingshot/live-search-people?t=${generateSearchTerm(terms)}&maxResults=5`;
    return this.getJson(url);
  };

  getSlideMenuItems = () => {
    const url = `${PROXY_URI}citeck/menu/menu`;
    return this.getJson(url).catch(() => []);
  };

  getMenuItemIconUrl = iconName => {
    const url = `${PROXY_URI}citeck/menu/icon?iconName=${iconName}`;
    return this.getJson(url).catch(() => null);
  };
}
