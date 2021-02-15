import React from 'react';

import BaseFormatter from '../BaseFormatter';
import { createDocumentUrl } from '../../../../../../helpers/urls';
import PageService from '../../../../../../services/PageService';

export default class AssocFormatter extends BaseFormatter {
  static TYPE = 'assoc';

  format(props) {
    const { cell, config = {} } = props;

    return cell.map(res => {
      const link = createDocumentUrl(res.assoc);
      const handler = e => {
        e.preventDefault();
        PageService.changeUrlLink(link, { openNewTab: !config.openInBackground });
      };

      return (
        <a key={res.assoc} href={link} onClick={handler}>
          {res.disp}
        </a>
      );
    });
  }
}
