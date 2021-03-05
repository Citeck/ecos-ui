import ActionsExecutor from '../../ActionsExecutor';
import Records from '../../../../Records';
import DialogManager from '../../../../../common/dialogs/Manager';

export default class ModuleCopyAction extends ActionsExecutor {
  static ACTION_ID = 'module-copy';

  async execForRecord(record, action, context) {
    const currentModuleId = await record.load('moduleId', true);

    if (!currentModuleId) {
      DialogManager.showInfoDialog({
        title: 'Копирование невозможно',
        text: 'Модуль не может быть копирован так как отсутствует moduleId'
      });
      return false;
    }

    return new Promise((resolve, reject) => {
      DialogManager.showFormDialog({
        title: 'Копировать',
        formData: {
          moduleId: currentModuleId
        },
        showDefaultButtons: true,
        formDefinition: {
          display: 'form',
          components: [
            {
              label: 'Новый идентификатор',
              type: 'textfield',
              key: 'moduleId'
            }
          ]
        },
        onSubmit: async submission => {
          const moduleId = submission.data.moduleId;
          const newRecId = record.id.replace(currentModuleId, moduleId);
          const existingId = await Records.get(newRecId).load('moduleId', true);

          if (existingId) {
            throw new Error('Модуль с таким ID уже существует');
          }

          record.att('moduleId', submission.data.moduleId);
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
