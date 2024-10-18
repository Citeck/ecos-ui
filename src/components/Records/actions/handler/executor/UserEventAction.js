import ActionsExecutor from '../ActionsExecutor';
import Records from '../../../../Records';
import { get } from 'lodash';
import { notifyFailure, notifySuccess } from '../../util/actionUtils';
import DialogManager from '../../../../common/dialogs/Manager';
import { t } from '../../../../../helpers/export/util';

export default class UserEventAction extends ActionsExecutor {
  static ACTION_ID = 'user-event';

  async execForRecord(record, action, context) {
    const eventType = get(action, 'id');
    const userEventDaoRecord = 'uiserv/user-event@' + eventType;
    const _record = Records.get(userEventDaoRecord);
    const eventRecord = get(action, 'config.record');
    const eventData = get(action, 'config.eventData') || {};

    _record.att('record', eventRecord);
    _record.att('eventData', eventData);

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
      name: 'record-action.name.user-event'
    };
  }
}
