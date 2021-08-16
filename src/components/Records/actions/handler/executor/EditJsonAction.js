import get from 'lodash/get';

import { AppApi } from '../../../../../api/app';
import Records from '../../../Records';
import { notifyFailure, notifySuccess, showForm } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

const appApi = new AppApi();

export default class EditJsonAction extends ActionsExecutor {
  static ACTION_ID = 'edit-json';

  async execForRecord(record, action, context) {
    const failure = (resolve, msg, e) => {
      console.error(msg, e);
      resolve(false);
      notifyFailure();
    };

    return new Promise(resolve => {
      showForm(record.id, {
        formId: get(action, 'config.editorFormId'),
        onSubmit: async (rec, form) => {
          try {
            const jsonStr = JSON.stringify(get(form, 'data.configuration'));
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
              .catch(e => failure(resolve, '[EditJsonAction saving]', e));
          } catch (e) {
            failure(resolve, '[EditJsonAction saving]', e);
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
