import { NotificationManager } from 'react-notifications';
import { t } from '../../../../helpers/export/util';

export function notifySuccess(msg) {
  NotificationManager.success(msg || t('record-action.msg.success.text'), t('record-action.msg.success.title'));
}

export function notifyFailure(msg) {
  NotificationManager.error(msg || t('record-action.msg.error.text'), t('record-action.msg.error.title'), 5000);
}
