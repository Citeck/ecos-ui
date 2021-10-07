import React from 'react';

import { createDocumentUrl } from '../../../../../../helpers/urls';
import PageService from '../../../../../../services/PageService';
import CellType from '../../CellType';
import BaseFormatter from '../BaseFormatter';

export default class AssocFormatter extends BaseFormatter {
  static TYPE = 'assoc';

  format(props) {
    const { cell, config = {} } = props;

    if (!cell || !cell.value) {
      return '';
    }

    const sourceId = config.sourceId;
    let value = cell.value;

    if (sourceId) {
      const localSourceIdDelimIdx = value.indexOf('@');

      if (localSourceIdDelimIdx >= 0 && localSourceIdDelimIdx < value.length - 1) {
        value = value.substring(localSourceIdDelimIdx + 1);
      }
      value = sourceId + '@' + value;
    }

    const link = createDocumentUrl(value);
    const handler = e => {
      e.preventDefault();
      const { openInBackground, openNewBrowserTab } = config;

      PageService.changeUrlLink(link, { openNewTab: !openInBackground, openInBackground, openNewBrowserTab });
    };

    return (
      <a href={link} onClick={handler}>
        {cell.disp}
      </a>
    );
  }

  getSupportedCellType() {
    return CellType.VALUE_WITH_DISP;
  }
}
