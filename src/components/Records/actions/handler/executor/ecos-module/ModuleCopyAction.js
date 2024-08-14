import ActionsExecutor from '../../ActionsExecutor';
import Records from '../../../../Records';
import DialogManager from '../../../../../common/dialogs/Manager';
import { t } from '../../../../../../helpers/util';

export default class ModuleCopyAction extends ActionsExecutor {
  static ACTION_ID = 'module-copy';

  async execForRecord(record, action, context) {
    let currentLocalId = await record.load('localId', true);

    if (!currentLocalId) {
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
          localId: currentLocalId
        },
        showDefaultButtons: true,
        formDefinition: {
          display: 'form',
          components: [
            {
              label: t('copy-action.new-id'),
              type: 'textfield',
              key: 'localId'
            }
          ]
        },
        onSubmit: async submission => {
          const moduleId = submission.data.localId;
          const newRecId = record.id.replace(currentLocalId, moduleId);
          const existingId = await Records.get(newRecId).load('localId', true);

          if (existingId) {
            throw new Error(t('admin-section.error.existed-module'));
          }

          record.att('id', submission.data.localId);
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
