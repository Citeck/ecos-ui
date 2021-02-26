import React from 'react';

import BaseFormatter from '../BaseFormatter';
import { createDocumentUrl } from '../../../../../../helpers/urls';
import PageService from '../../../../../../services/PageService';
import CellType from '../../CellType';

export default class AssocFormatter extends BaseFormatter {
  static TYPE = 'assoc';

  format(props) {
    const { cell, config = {} } = props;

    const link = createDocumentUrl(cell.value);
    const handler = e => {
      e.preventDefault();
      PageService.changeUrlLink(link, { openNewTab: !config.openInBackground });
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
