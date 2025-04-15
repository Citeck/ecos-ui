import { nth, split, get, isNil } from 'lodash';

import { getData, getSessionData, isExistLocalStorage, isExistSessionStorage, setSessionData } from '../helpers/ls';
import { createDocumentUrl, createProfileUrl } from '../helpers/urls';
import { formatFileSize, getIconFileByMimetype, getRelativeTime, t } from '../helpers/util';

const Urls = {
  DASHBOARD: ref => createDocumentUrl(ref),
  USER: login => createProfileUrl(login)
};

export const LiveSearchTypes = {
  PEOPLE: 'PEOPLE',
  DOCUMENTS: 'DOCUMENTS',
  SITES: 'SITES',
  WORKSPACES: 'WORKSPACES'
};

export default class SearchService {
  static SearchAutocompleteTypes = Object.fromEntries(Object.keys(LiveSearchTypes).map((key, index) => [key, index]));

  static formatSearchAutocompleteResults = function (item, type, hasAlfresco) {
    const Types = SearchService.SearchAutocompleteTypes;

    if (!hasAlfresco) {
      delete LiveSearchTypes.SITES;
    }

    const data = {
      type,
      title: '',
      description: '',
      icon: '',
      url: '',
      wsName: '',
      iconUrl: ''
    };
    const isEnabledAlfresco = isNil(get(item, 'isNotAlfresco')) || get(item, 'isNotAlfresco') === false;

    switch (type) {
      case Types.DOCUMENTS:
        const modifiedTimeParts = getRelativeTime(item.modifiedOn);
        const fileSize = formatFileSize(item.size);
        const link = Urls.DASHBOARD(item.nodeRef);

        data.icon = getIconFileByMimetype(item.mimetype);
        data.title = item.name;
        data.url = link;

        data.description = `${modifiedTimeParts.relative}`;
        if (isEnabledAlfresco) {
          data.description += ` / ${t('search.size')}: ${fileSize}`;
        }

        break;

      case Types.SITES:
        data.title = item.title;
        data.description = item.description;
        data.icon = '';

        if (isEnabledAlfresco) {
          const siteRef = 'workspace://' + nth(split(item.node, 'node/workspace/'), 1);
          data.url = Urls.DASHBOARD(siteRef);
        } else {
          data.url = item.url;
          data.iconUrl = item.icon;
        }

        break;

      case Types.WORKSPACES:
        data.title = item.title;
        data.description = item.description;
        data.url = item.url;
        data.iconUrl = item.image;
        data.wsName = item.name;

        break;

      case Types.PEOPLE:
        data.avatarUrl = item.avatarUrl || '';
        data.title = `${item.firstName} ${item.lastName} (${item.userName})`;
        data.url = Urls.USER(item.userName);
        data.description = [item.jobtitle, item.location].filter(Boolean).join(', ');
        break;

      default:
        console.warn('Unknown search autocomplete item type');
    }
    return data;
  };

  static getSearchTextFromHistory(isArrowUp) {
    if (!isExistLocalStorage()) {
      return null;
    }

    const searchPhrases = getData('ALF_SEARCHBOX_HISTORY');
    let lastSearchIndex = isExistSessionStorage() ? getSessionData('LAST_SEARCH_INDEX') : null;

    if (!searchPhrases) {
      return '';
    }

    if (isArrowUp) {
      if (lastSearchIndex === 0 || lastSearchIndex === null) {
        lastSearchIndex = searchPhrases.length - 1;
      } else {
        lastSearchIndex--;
      }
    } else {
      if (lastSearchIndex === searchPhrases.length - 1 || lastSearchIndex === null) {
        lastSearchIndex = 0;
      } else {
        lastSearchIndex++;
      }
    }

    if (isExistSessionStorage()) {
      setSessionData('LAST_SEARCH_INDEX', lastSearchIndex);
    }

    return searchPhrases[lastSearchIndex];
  }
}
