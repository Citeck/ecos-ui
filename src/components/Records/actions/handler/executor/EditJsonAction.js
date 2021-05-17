import get from 'lodash/get';

import { AppApi } from '../../../../../api/app';
import EcosFormUtils from '../../../../EcosForm/EcosFormUtils';
import Records from '../../../Records';
import { notifyFailure, notifySuccess } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

const appApi = new AppApi();

export default class EditJsonAction extends ActionsExecutor {
  static ACTION_ID = 'edit-json';

  async execForRecord(record, action, context) {
    return new Promise(resolve => {
      EcosFormUtils.editRecord({
        recordRef: record.id,
        formKey: 'form-json-editor',
        onSubmit: async (rec, form) => {
          const blob = new Blob([get(form, 'data.config')], { type: 'application/json' });
          const url = await appApi.getBase64(blob);
          const record = Records.get(rec.id);

          record.att('_content', [{ url }]);

          return record
            .save()
            .then(resolve => {
              notifySuccess();
              resolve(true);
            })
            .catch(e => {
              console.error('[EditJsonAction]', e);
              notifyFailure();
              resolve(false);
            });
        }
      });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'Edit JSON config'
    };
  }
}
