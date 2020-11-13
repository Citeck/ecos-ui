import React from 'react';
import get from 'lodash/get';

import { createDocumentUrl, isNewVersionPage } from '../../../../../helpers/urls';
import { REMOTE_TITLE_ATTR_NAME } from '../../../../../constants/pageTabs';
import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class DocumentLinkFormatter extends DefaultGqlFormatter {
  static getQueryString(attribute) {
    return `.att(n:"${attribute}"){displayName:disp, id}`;
  }

  value(cell) {
    if (typeof cell === 'string') {
      return cell;
    }

    return get(cell, 'displayName', '');
  }

  render() {
    let props = this.props;
    let cell = props.cell || {};
    let linkProps = {};
    const url = createDocumentUrl(cell.id);

    if (isNewVersionPage()) {
      linkProps = {
        target: '_blank',
        rel: 'noopener noreferrer',
        ...{ [REMOTE_TITLE_ATTR_NAME]: true }
      };
    }

    return (
      <a href={url} {...linkProps}>
        {this.value(cell)}
      </a>
    );
  }
}
