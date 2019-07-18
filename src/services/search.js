import { formatFileSize, getIconFileByMimetype, getRelativeTime, t } from '../helpers/util';
import { getData, getSessionData, isExistLocalStorage, isExistSessionStorage, setSessionData } from '../helpers/ls';

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
        const site = item.site ? 'site/' + item.site.shortName + '/' : '';
        const modifiedTimeParts = getRelativeTime(item.modifiedOn);
        const fileSize = formatFileSize(item.size);

        let link;

        switch (item.container) {
          case 'wiki':
            link = 'wiki-page?title=' + encodeURIComponent(item.name);
            break;
          case 'blog':
            link = 'blog-postview?postId=' + encodeURIComponent(item.name);
            item.name = item.title;
            break;
          default:
            link = 'document-details?nodeRef=' + item.nodeRef;
            break;
        }

        data.icon = getIconFileByMimetype(item.mimetype);
        data.title = item.name;
        // data.url = '/share/page/' + site + link;
        data.url = '/v2/' + site + link;
        data.description = `${modifiedTimeParts.relative} / ${t('Размер')}: ${fileSize}`;
        break;
      case Types.SITES:
        data.icon = '';
        data.title = item.title;
        data.url = '/share/page/site/' + item.shortName + '/dashboard';
        // data.url = '/v2/dashboard/' + item.shortName;
        data.description = item.description;
        break;
      case Types.PEOPLE:
        data.avatarUrl = '';
        data.title = `${item.firstName} ${item.lastName} (${item.userName})`;
        data.url = '/share/page/user/' + item.userName + '/profile';
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
