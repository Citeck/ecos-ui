import { NotificationManager } from 'react-notifications';

import { t } from '../../../../helpers/export/util';
import EcosFormUtils from '../../../EcosForm/EcosFormUtils';

export function notifySuccess(msg) {
  NotificationManager.success(msg || t('record-action.msg.success.text'), t('record-action.msg.success.title'));
}

export function notifyFailure(msg) {
  NotificationManager.error(msg || t('record-action.msg.error.text'), t('record-action.msg.error.title'), 5000);
}

export function showForm(recordRef, params, className = '') {
  EcosFormUtils.eform(recordRef, {
    params,
    class: 'ecos-modal_width-lg ' + className,
    isBigHeader: true
  });
}
