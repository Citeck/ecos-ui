import { CommonApi } from './common';
import { generateSearchTerm, getCurrentUserName } from '../helpers/util';
import { PROXY_URI } from '../constants/alfresco';
import Records from '../components/Records';
import { QueryKeys, URL } from '../constants';

const PREFIX = 'uiserv/config@';

export class MenuApi extends CommonApi {
  getNewJournalPageUrl = params => {
    let listId = params.listId;
    let siteId = params.siteName;
    let journalRef = params.journalRef || '';

    if (listId) {
      let tokens = listId.split('-');

      if (tokens.length > 1) {
        if (tokens[0] === 'site') {
          siteId = listId.substring('site-'.length, listId.length - tokens[tokens.length - 1].length - 1);
        } else if (tokens[0] === 'global') {
          siteId = null;

          listId = listId.substring('global-'.length);
        }
      }
    } else {
      listId = 'main';
    }

    if (siteId) {
      listId = 'site-' + siteId + '-' + listId;
    } else {
      listId = 'global-' + listId;
    }

    return `${URL.JOURNAL}?journalId=${journalRef}&journalSettingId=&journalsListId=${listId}`;
  };

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
    const username = getCurrentUserName();
    return this.getJsonWithSessionCache({
      url: `${PROXY_URI}citeck/menu/menu?username=${username}`,
      timeout: 14400000 //4h
    }).catch(() => {});
  };

  getMenuItemIconUrl = iconName => {
    return this.getJsonWithSessionCache({
      url: `${PROXY_URI}citeck/menu/icon?iconName=${iconName}`,
      timeout: 14400000, //4h
      onError: () => null
    });
  };

  getJournalTotalCount = journalId => {
    //TODO: move this to a menu config
    if (journalId === 'active-tasks' || journalId === 'subordinate-tasks') {
      const url = `${PROXY_URI}api/journals/records/count?journal=${journalId}`;
      return this.getJson(url)
        .then(resp => resp.recordsCount)
        .catch(err => {
          console.error(err);
          return 0;
        });
    } else {
      return Promise.resolve(0);
    }
  };

  getMenuConfig = (disabledCache = false) => {
    return Records.get(`${PREFIX}menu-config`)
      .load([QueryKeys.VALUE_JSON], disabledCache)
      .then(resp => resp);
  };

  saveMenuConfig = ({ config = {}, title = '', description = '' }) => {
    const record = Records.get(`${PREFIX}menu-config`);

    record.att(QueryKeys.VALUE_JSON, config);
    record.att(QueryKeys.TITLE, title);
    record.att(QueryKeys.DESCRIPTION, description);

    return record.save().then(resp => resp);
  };
}
