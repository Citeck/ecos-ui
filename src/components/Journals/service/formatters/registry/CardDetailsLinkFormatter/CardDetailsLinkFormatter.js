import React from 'react';

import BaseFormatter from '../BaseFormatter';
import { createDocumentUrl } from '../../../../../../helpers/urls';
import { REMOTE_TITLE_ATTR_NAME } from '../../../../../../constants/pageTabs';

export default class CardDetailsLinkFormatter extends BaseFormatter {
  static TYPE = 'сardDetailsLink';

  format(props) {
    const { row = {}, cell } = props;
    const url = createDocumentUrl(row.id);

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...{ [REMOTE_TITLE_ATTR_NAME]: true }}>
        {cell}
      </a>
    );
  }
}
