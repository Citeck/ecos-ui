import React from 'react';
import isString from 'lodash/isString';

import BaseFormatter from '../BaseFormatter';
import { createDocumentUrl } from '../../../../../../helpers/urls';
import { REMOTE_TITLE_ATTR_NAME } from '../../../../../../constants/pageTabs';

export default class LinkFormatter extends BaseFormatter {
  static TYPE = 'link';

  format(props) {
    const { row = {}, cell, config = {} } = props;

    let href = createDocumentUrl(row.id);

    // is computed from config
    if (isString(config.url)) {
      href = config.url;
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...{ [REMOTE_TITLE_ATTR_NAME]: true }}>
        {cell}
      </a>
    );
  }

  getAliases() {
    return ['сardDetailsLink'];
  }
}
