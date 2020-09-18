import ActionsExecutor from '../../ActionsExecutor';
import Records from '../../../../Records';
import { isExistValue, t } from '../../../../../../helpers/util';
import dialogManager from '../../../../../common/dialogs/Manager/DialogManager';
import { notifySuccess, notifyFailure } from '../../../util/actionUtils';

export default class CancelBusinessProcessAction extends ActionsExecutor {
  static ACTION_ID = 'cancel-business-process';

  async execForRecord(record, action, context) {
    const rec = Records.get(record);
    rec.att('cancel', true);

    return rec
      .save()
      .then(record => {
        if (!isExistValue(record)) {
          return;
        }

        if (record.id) {
          notifySuccess();
          return true;
        }

        return Promise.reject();
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        e && e.message && dialogManager.showInfoDialog({ title: t('error'), text: e.message });
        return false;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.cancel-business-process',
      icon: 'icon-small-close'
    };
  }
}
