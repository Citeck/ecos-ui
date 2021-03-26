import React from 'react';

import RecordActions from '../../../../../Records/actions/recordActions';
import BaseFormatter from '../BaseFormatter';
import { extractLabel } from '../../../../../../helpers/util';

export default class ActionFormatter extends BaseFormatter {
  static TYPE = 'action';

  format(props) {
    const { row, cell, config = {} } = props;

    if (!row || !(row.id || row.recordRef)) {
      return '';
    }

    const { type } = config;
    const info = RecordActions.getActionInfo({ type });
    const actionName = extractLabel(info.name);

    const handler = () => {
      const ref = row.id || row.recordRef;
      RecordActions.execForRecord(ref, { type });
    };

    return (
      <div className="ecos-formatter-action__text" onClick={handler} title={actionName}>
        {cell}
      </div>
    );
  }
}
