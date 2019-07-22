import { nth, split } from 'lodash';
import { formatFileSize, getIconFileByMimetype, getRelativeTime, t } from '../helpers/util';
import { getData, getSessionData, isExistLocalStorage, isExistSessionStorage, setSessionData } from '../helpers/ls';

const Versions = {
  V1: '/share/page',
  V2: '/v2'
};

const Urls = {
  DASHBOARD: ref => Versions.V2 + '/dashboard?recordRef=' + ref,
  USER: login => Versions.V1 + '/user/' + login + '/profile',
  OTHER_DOC: (item, prefix) => Versions.V1 + (item.site ? 'site/' + item.site.shortName + '/' : '') + prefix + encodeURIComponent(item.name)
};

export default class SearchService {
  static SearchAutocompleteTypes = {
    DOCUMENTS: 0,
    SITES: 1,
    PEOPLE: 2
  };

  static formatSearchAutocompleteResults = function(item, type) {
    const Types = SearchService.SearchAutocompleteTypes;
    const data = {
      type,
      title: '',
      description: '',
      icon: '',
      url: ''
    };

    switch (type) {
      case Types.DOCUMENTS:
        const modifiedTimeParts = getRelativeTime(item.modifiedOn);
        const fileSize = formatFileSize(item.size);
        let link;

        switch (item.container) {
          case 'wiki':
            link = Urls.OTHER_DOC(item, 'wiki-page?title=');
            break;
          case 'blog':
            link = Urls.OTHER_DOC(item, 'blog-postview?postId=');
            item.name = item.title;
            break;
          default:
            link = Urls.DASHBOARD(item.nodeRef);
            break;
        }

        data.icon = getIconFileByMimetype(item.mimetype);
        data.title = item.name;
        data.url = link;
        data.description = `${modifiedTimeParts.relative} / ${t('Размер')}: ${fileSize}`;
        break;
      case Types.SITES:
        const siteRef = 'workspace://' + nth(split(item.node, 'node/workspace/'), 1);
        data.icon = '';
        data.title = item.title;
        data.url = Urls.DASHBOARD(siteRef);
        data.description = item.description;
        break;
      case Types.PEOPLE:
        data.avatarUrl = '';
        data.title = `${item.firstName} ${item.lastName} (${item.userName})`;
        data.url = Urls.USER(item.userName);
        data.description = (item.jobtitle || '') + (item.location ? ', ' + item.location : '');
        break;
      default:
        console.log('Unknown search autocomplete item type');
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
