import get from 'lodash/get';

import { t } from '../../../../../helpers/export/util';
import DialogManager from '../../../../common/dialogs/Manager';
import Records from '../../../Records';
import { notifyFailure, notifySuccess } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class MutateAction extends ActionsExecutor {
  static ACTION_ID = 'mutate';

  async execForRecord(record, action, context) {
    const recordId = get(action, 'config.record.id');
    const attributes = get(action, 'config.record.attributes') || {};
    const _record = recordId ? Records.get(recordId) : record;

    for (let att in attributes) {
      if (attributes.hasOwnProperty(att)) {
        _record.att(att, attributes[att]);
      }
    }

    return _record
      .save()
      .then(() => {
        notifySuccess();
        return true;
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        e && e.message && DialogManager.showInfoDialog({ title: t('error'), text: e.message });
        return false;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.mutate-action',
      icon: 'icon-arrow'
    };
  }
}
