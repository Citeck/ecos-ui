import React from 'react';
import isPlainObject from 'lodash/isPlainObject';

import BaseFormatter from '../BaseFormatter';
import { createDocumentUrl } from '../../../../../../helpers/urls';
import PageService from '../../../../../../services/PageService';

export default class AssocFormatter extends BaseFormatter {
  static TYPE = 'assoc';

  format(props) {
    const { cell, config = {} } = props;

    let cellVal = cell;
    if (!isPlainObject(cellVal)) {
      cellVal = { value: cellVal, disp: cellVal };
    }

    const link = createDocumentUrl(cellVal.value);
    const handler = e => {
      e.preventDefault();
      PageService.changeUrlLink(link, { openNewTab: !config.openInBackground });
    };

    return (
      <a key={cellVal.value} href={link} onClick={handler}>
        {cellVal.disp}
      </a>
    );
  }
}
