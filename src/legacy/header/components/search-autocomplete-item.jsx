import React, { Fragment } from 'react';
import { formatFileSize, getRelativeTime } from '../misc/util';

export const SEARCH_AUTOCOMPLETE_TYPE_DOCUMENTS = 0;
export const SEARCH_AUTOCOMPLETE_TYPE_SITES = 1;
export const SEARCH_AUTOCOMPLETE_TYPE_PEOPLE = 2;

const Alfresco = window.Alfresco || {};

const SearchAutocompleteItem = ({ type, item }) => {
  let itemTitle = '';
  let itemLabel = '';
  let itemUrl = '';
  let thumbnailUrl = '';
  let thumbnailTitle = '';
  let thumbnailAlt = '';
  let itemMeta = null;

  switch (type) {
    case SEARCH_AUTOCOMPLETE_TYPE_DOCUMENTS:
      itemLabel = item.name;
      itemTitle = item.title || '';
      if (item.description) {
        if (itemTitle.length > 0) {
          itemTitle += '\r\n';
        }
        itemTitle += item.description;
      }

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

      itemUrl = '/share/page/' + site + link;

      const lastModified = item.lastThumbnailModification || 1;
      thumbnailUrl =
        Alfresco.constants.PROXY_URI +
        'api/node/' +
        item.nodeRef.replace(':/', '') +
        '/content/thumbnails/doclib?c=queue&ph=true&lastModified=' +
        lastModified;
      thumbnailTitle = item.name;
      thumbnailAlt = item.name;

      let siteDocLib = null;
      if (item.site) {
        const siteDocLibUrl = '/share/page/' + site + 'documentlibrary';
        siteDocLib = (
          <Fragment>
            <a href={siteDocLibUrl}>{item.site.title}</a> |
          </Fragment>
        );
      }
      const modifiedUserUrl = '/share/page/user/' + item.modifiedBy + '/profile';
      const modifiedTimeParts = getRelativeTime(item.modifiedOn);
      const fileSize = formatFileSize(item.size);

      itemMeta = (
        <Fragment>
          {siteDocLib} <a href={modifiedUserUrl}>{item.modifiedBy}</a> |{' '}
          <span title={modifiedTimeParts.formatted}>{modifiedTimeParts.relative}</span> | {fileSize}
        </Fragment>
      );
      break;
    case SEARCH_AUTOCOMPLETE_TYPE_SITES:
      itemTitle = item.description;
      itemLabel = item.title;
      itemUrl = '/share/page/site/' + item.shortName + '/dashboard';

      thumbnailUrl = Alfresco.constants.URL_RESCONTEXT + 'components/images/filetypes/generic-site-32.png';
      thumbnailTitle = item.title;
      thumbnailAlt = item.title;

      itemMeta = item.description;
      break;
    case SEARCH_AUTOCOMPLETE_TYPE_PEOPLE:
      const fullName = item.firstName + ' ' + item.lastName;

      itemTitle = item.jobtitle || '';
      itemLabel = fullName + ' (' + item.userName + ')';
      itemUrl = '/share/page/user/' + item.userName + '/profile';

      thumbnailUrl = Alfresco.constants.PROXY_URI + 'slingshot/profile/avatar/' + encodeURIComponent(item.userName) + '/thumbnail/avatar32';
      thumbnailTitle = itemLabel;
      thumbnailAlt = fullName;

      itemMeta = (item.jobtitle || '') + (item.location ? ', ' + item.location : '');

      break;
    default:
      console.log('Unknown search autocomplete item type');
  }

  return (
    <li title={itemTitle} className="autocomplete-item">
      <div className="autocomplete-item__thumbnail">
        <a href={itemUrl} title={thumbnailTitle}>
          <img src={thumbnailUrl} alt={thumbnailAlt} />
        </a>
      </div>
      <div className="autocomplete-item__content">
        <p>
          <a href={itemUrl} title={itemTitle}>
            {itemLabel}
          </a>
        </p>
        <p className="autocomplete-item__content_p_second">{itemMeta}</p>
      </div>
    </li>
  );
};

export default SearchAutocompleteItem;
