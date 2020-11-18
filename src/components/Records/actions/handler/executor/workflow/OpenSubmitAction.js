import get from 'lodash/get';

import Records from '../../../../Records';
import { t } from '../../../../../../helpers/export/util';
import { notifyFailure, notifySuccess, showForm } from '../../../util/actionUtils';
import ActionsExecutor from '../../ActionsExecutor';

export default class OpenSubmitAction extends ActionsExecutor {
  static ACTION_ID = 'open-submit-form';

  async execForRecord(record, action, context) {
    const formId = get(action, 'config.formId');
    const rec = Records.get(record);

    return new Promise(resolve => {
      const params = {
        formId,
        onSubmit: record => {
          record.update();
          resolve(true);
          notifySuccess();
        },
        onFormCancel: () => resolve(false),
        onReadyToSubmit: function(form, state) {
          if (state) {
            form.executeSubmit();
          } else {
            notifyFailure(t('eform.form-is-not-ready'));
          }
        }
      };

      showForm(rec.id, params);
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.open-submit-form',
      icon: 'icon-arrow'
    };
  }
}
