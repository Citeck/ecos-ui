import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { AppApi } from '../../../../../api/app';
import Records from '../../../Records';
import { notifyFailure, notifySuccess, showForm } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

const JSON_SCALAR = '?json';

const appApi = new AppApi();

export default class EditJsonAction extends ActionsExecutor {
  static ACTION_ID = 'edit-json';

  async execForRecord(record, action, context) {
    const failure = (resolve, msg, e) => {
      console.error(msg, e);
      resolve(false);
      notifyFailure();
    };
    const contentAttribute = get(action, 'config.contentAttribute', JSON_SCALAR);

    return new Promise(resolve => {
      showForm(record.id, {
        formId: get(action, 'config.editorFormId'),
        options: {
          contentAttribute
        },
        onSubmit: async (rec, form) => {
          try {
            const jsonData = get(form, 'data.configuration');
            if (!jsonData || isEmpty(jsonData)) {
              failure(resolve, 'Config is null or empty');
              return;
            }

            const record = Records.get(rec.id);

            if (contentAttribute === JSON_SCALAR) {
              const jsonStr = JSON.stringify(jsonData);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = await appApi.getBase64(blob);
              record.att('_content', [{ url }]);
            } else {
              record.att(contentAttribute, jsonData);
            }

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
