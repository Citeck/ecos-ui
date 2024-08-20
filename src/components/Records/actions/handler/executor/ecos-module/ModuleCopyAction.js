import get from 'lodash/get';

import ActionsExecutor from '../../ActionsExecutor';
import Records from '../../../../Records';
import DialogManager from '../../../../../common/dialogs/Manager';
import { t } from '../../../../../../helpers/util';

export default class ModuleCopyAction extends ActionsExecutor {
  static ACTION_ID = 'module-copy';

  async execForRecord(record, action, context) {
    const currentLocalId = await record.load('localId', true);
    const currentModuleId = await record.load('moduleId', true);

    const param = currentModuleId ? 'moduleId' : currentLocalId ? 'localId' : null;
    const data = currentModuleId || currentLocalId;

    if (!data || !param) {
      DialogManager.showInfoDialog({
        title: t('copy-action.error.title'),
        text: t('copy-action.error.text')
      });
      return false;
    }

    return new Promise((resolve, reject) => {
      DialogManager.showFormDialog({
        title: t('copy-action.title'),
        formData: {
          [param]: data
        },
        showDefaultButtons: true,
        formDefinition: {
          display: 'form',
          components: [
            {
              label: t('copy-action.new-id'),
              type: 'textfield',
              key: param
            }
          ]
        },
        onSubmit: async submission => {
          const id = get(submission, `data.${param}`);
          const newRecId = record.id.replace(data, id);
          const existingId = await Records.get(newRecId).load(param, true);

          if (existingId) {
            throw new Error(t('admin-section.error.existed-module'));
          }

          record.att('id', get(submission, `data.${param}`));
          record
            .save()
            .then(() => resolve(true))
            .catch(reject);
        }
      });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'module.copy',
      icon: 'icon-copy'
    };
  }
}
