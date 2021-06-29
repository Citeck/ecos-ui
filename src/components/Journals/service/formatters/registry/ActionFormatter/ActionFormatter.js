import React from 'react';

import RecordActions from '../../../../../Records/actions/recordActions';
import BaseFormatter from '../BaseFormatter';
import { t, extractLabel } from '../../../../../../helpers/util';
import { NotificationManager } from 'react-notifications';

export default class ActionFormatter extends BaseFormatter {
  static TYPE = 'action';

  format(props) {
    const { row, cell, config = {} } = props;

    if (!row || !(row.id || row.recordRef)) {
      return '';
    }

    const { type, actionId } = config;
    let handler = () => {
      const ref = row.id || row.recordRef;
      RecordActions.execForRecord(ref, { type });
    };
    let actionName = '';
    if (!actionId) {
      const info = RecordActions.getActionInfo({ type });
      actionName = extractLabel(info.name);
    } else {
      handler = async () => {
        const ref = row.id || row.recordRef;
        const actions = await RecordActions.getActionsForRecord(ref, [actionId]);
        if (!actions.length) {
          NotificationManager.error(t('journals.formatter.action.execution-error'));
        } else {
          RecordActions.execForRecord(ref, actions[0]);
        }
      };
    }
    return (
      <div className="ecos-formatter-action__text" onClick={handler} title={actionName}>
        {cell}
      </div>
    );
  }

  getAliases() {
    return ['ActionFormatter'];
  }
}
