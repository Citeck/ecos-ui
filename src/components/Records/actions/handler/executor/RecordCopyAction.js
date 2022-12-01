import ActionsExecutor from '../ActionsExecutor';
import Records from '../../../Records';
import DialogManager from '../../../../common/dialogs/Manager';
import isUndefined from 'lodash/isUndefined';

export default class RecordCopyAction extends ActionsExecutor {
  static ACTION_ID = 'record-copy';

  async execForRecord(record, action, context) {
    const currentModuleId = record.id.substring(record.id.indexOf('@') + 1);

    return new Promise(resolve => {
      DialogManager.showFormDialog({
        title: 'Копировать',
        formData: {
          id: currentModuleId
        },
        showDefaultButtons: true,
        formDefinition: {
          display: 'form',
          components: [
            {
              label: 'Новый идентификатор',
              type: 'textfield',
              key: 'id'
            }
          ]
        },
        onSubmit: async submission => {
          const recordLocalId = submission.data.id;
          const newRecId = record.id.replace(currentModuleId, recordLocalId);

          const notExists = await Records.get(newRecId).load('_notExists?bool', true);

          if (notExists !== true) {
            throw new Error('Модуль с таким ID уже существует');
          }

          record.att('id', recordLocalId);
          const newRec = await record.save();

          let actionResult = true;
          if (context.onRecordCreated) {
            const callbackRes = await context.onRecordCreated(newRec);
            if (!isUndefined(callbackRes)) {
              actionResult = callbackRes;
            }
          }
          resolve(actionResult);
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

  getAliases() {
    return ['module-copy'];
  }
}
