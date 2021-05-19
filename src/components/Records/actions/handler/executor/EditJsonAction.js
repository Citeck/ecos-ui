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
          try {
            const jsonStr = JSON.stringify(get(form, 'data.config'));
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = await appApi.getBase64(blob);
            const record = Records.get(rec.id);

            record.att('_content', [{ url }]);
            return record
              .save()
              .then(_ => {
                resolve(true);
                notifySuccess();
              })
              .catch(e => {
                console.error('[EditJsonAction saving]', e);
                resolve(false);
                notifyFailure();
              });
          } catch (e) {
            console.error('[EditJsonAction json parser]', e);
            resolve(false);
            notifyFailure();
          }
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
