import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { JournalUrlParams } from '../../../../constants';
import DocLibConverter from '../../../../dto/docLib';

import './DocLibBreadcrumbs.scss';

const DocLibBreadcrumbs = ({ path = [], onClick }) => {
  if (!Array.isArray(path) || !path.length) {
    return null;
  }

  const _onClick = id => typeof onClick === 'function' && onClick(id);

  const _renderItem = item => {
    const completeItem = DocLibConverter.completeItemId(item);
    const folderId = completeItem.id;
    const title = completeItem.disp;

    const urlParts = queryString.parseUrl(window.location.href);
    const query = urlParts.query;
    query[JournalUrlParams.DOCLIB_FOLDER_ID] = folderId;
    const urlQuery = queryString.stringify(query);
    const url = `${urlParts.url}?${urlQuery}`;

    return (
      <React.Fragment key={folderId}>
        <span className="ecos-doclib__breadcrumbs-link-separator">/</span>
        <a
          href={url}
          onClick={e => {
            e.preventDefault();
            _onClick(folderId);
          }}
          className="ecos-doclib__breadcrumbs-link"
        >
          {title}
        </a>
      </React.Fragment>
    );
  };

  return <div className="ecos-doclib__breadcrumbs">{path.map(_renderItem)}</div>;
};

DocLibBreadcrumbs.propTypes = {
  stateId: PropTypes.string,
  path: PropTypes.array,
  onClick: PropTypes.func
};

export default DocLibBreadcrumbs;
