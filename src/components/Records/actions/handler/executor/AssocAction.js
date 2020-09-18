import ActionsExecutor from '../ActionsExecutor';
import get from 'lodash/get';
import Records from '../../../Records';
import { t } from '../../../../../helpers/export/util';
import recordActions from '../../recordActions';
import { notifyFailure } from '../../util/actionUtils';

export default class AssocAction extends ActionsExecutor {
  static ACTION_ID = 'assoc-action';

  async execForRecord(record, action, context) {
    const innerAction = get(action, 'config.action', null);
    let assoc = get(action, 'config.assoc', '');

    if (!assoc.includes('?')) {
      assoc += '?id';
    }

    return Records.get(record)
      .load(assoc, true)
      .then(result => {
        if (!result) {
          notifyFailure(t('record-action.assoc-action.not-found'));
          return;
        }
        if (innerAction) {
          return recordActions.execForRecord(result, innerAction);
        }
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.assoc-action'
    };
  }
}
