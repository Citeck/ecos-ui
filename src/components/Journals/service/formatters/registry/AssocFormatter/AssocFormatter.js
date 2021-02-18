import React from 'react';

import BaseFormatter from '../BaseFormatter';
import { createDocumentUrl } from '../../../../../../helpers/urls';
import PageService from '../../../../../../services/PageService';

export default class AssocFormatter extends BaseFormatter {
  static TYPE = 'assoc';

  format(props) {
    const { cell, config = {} } = props;
    let cellData = cell;

    if (!cellData) {
      return cellData;
    }

    if (!Array.isArray(cellData)) {
      cellData = [cellData];
    }

    return cellData.map(res => {
      const link = createDocumentUrl(res.value);
      const handler = e => {
        e.preventDefault();
        PageService.changeUrlLink(link, { openNewTab: !config.openInBackground });
      };

      return (
        <a key={res.value} href={link} onClick={handler}>
          {res.disp}
        </a>
      );
    });
  }
}
