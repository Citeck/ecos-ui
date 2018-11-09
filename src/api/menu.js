import { CommonApi } from './common';
import { generateSearchTerm } from '../misc/util';

export class MenuApi extends CommonApi {
  getCreateVariantsForAllSites = () => {
    const url = 'api/journals/create-variants/site/ALL';
    return this.getJson(url).catch(() => []);
  };

  getLiveSearchDocuments = (terms, startIndex) => {
    const url = 'slingshot/live-search-docs?t=' + generateSearchTerm(terms) + '&maxResults=5&startIndex=' + startIndex;
    return this.getJson(url).catch(() => {});
  };

  getLiveSearchSites = terms => {
    const url = 'slingshot/live-search-sites?t=' + generateSearchTerm(terms) + '&maxResults=5';
    return this.getJson(url).catch(() => {});
  };

  getLiveSearchPeople = terms => {
    const url = 'slingshot/live-search-people?t=' + generateSearchTerm(terms) + '&maxResults=5';
    return this.getJson(url).catch(() => {});
  };
}
