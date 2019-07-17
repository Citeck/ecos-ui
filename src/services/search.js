import { formatFileSize, getRelativeTime, t } from '../helpers/util';
import { PROXY_URI, URL_RESCONTEXT } from '../constants/alfresco';

export default class SearchService {
  static SearchAutocompleteTypes = {
    DOCUMENTS: 0,
    SITES: 1,
    PEOPLE: 2
  };

  static formatSearchAutocompleteResults = function(item, type) {
    const Types = SearchService.SearchAutocompleteTypes;
    let thumbnailUrl = '';
    let thumbnailTitle = '';
    let thumbnailAlt = '';

    const data = {
      title: '',
      description: '',
      icon: '',
      url: ''
    };

    switch (type) {
      case Types.DOCUMENTS:
        const site = item.site ? 'site/' + item.site.shortName + '/' : '';
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

        const lastModified = item.lastThumbnailModification || 1;
        thumbnailUrl =
          PROXY_URI +
          'api/node/' +
          item.nodeRef.replace(':/', '') +
          '/content/thumbnails/doclib?c=queue&ph=true&lastModified=' +
          lastModified;
        thumbnailTitle = item.name;
        thumbnailAlt = item.name;

        let siteDocLib = null;
        if (item.site) {
          const siteDocLibUrl = '/share/page/' + site + 'documentlibrary';
          const siteTitle = item.site.title;
        }
        const modifiedUserUrl = '/share/page/user/' + item.modifiedBy + '/profile';
        const modifiedTimeParts = getRelativeTime(item.modifiedOn);
        const fileSize = formatFileSize(item.size);

        data.icon = '';
        data.title = item.name;
        data.url = '/share/page/' + site + link;
        data.description = `${modifiedTimeParts.relative} / ${t('Размер')}: ${fileSize}`;

        return data;
      case Types.SITES:
        thumbnailUrl = URL_RESCONTEXT + 'components/images/filetypes/generic-site-32.png';

        data.icon = '';
        data.title = item.title;
        data.url = '/share/page/site/' + item.shortName + '/dashboard';
        data.description = item.description;

        return data;
      case Types.PEOPLE:
        thumbnailUrl = PROXY_URI + 'slingshot/profile/avatar/' + encodeURIComponent(item.userName) + '/thumbnail/avatar32';

        data.icon = '';
        data.title = `${item.firstName} ${item.lastName} (${item.userName})`;
        data.url = '/share/page/user/' + item.userName + '/profile';
        data.description = (item.jobtitle || '') + (item.location ? ', ' + item.location : '');

        return data;
      default:
        console.log('Unknown search autocomplete item type');
        return data;
    }
  };
}
