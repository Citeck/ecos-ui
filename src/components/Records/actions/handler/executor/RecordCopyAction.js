import ActionsExecutor from '../ActionsExecutor';
import Records from '../../../Records';
import DialogManager from '../../../../common/dialogs/Manager';
import isUndefined from 'lodash/isUndefined';
import { t } from '../../../../../helpers/util';

const NOT_EXISTS_ATT = '_notExists?bool';
const MODULE_ID_REGEX = /@(?:.*[:$])?(.+)$/;

export default class RecordCopyAction extends ActionsExecutor {
  static ACTION_ID = 'record-copy';

  async execForRecord(record, action, context) {
    const match = record.id.match(MODULE_ID_REGEX);
    const currentModuleId = match ? match[1] : record.id;

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

          const notExists = await Records.get(newRecId).load(NOT_EXISTS_ATT, true);

          if (notExists !== true) {
            throw new Error(t('admin-section.error.existed-module'));
          }

          record.att('id', recordLocalId);
          const newRec = await record.save();
          newRec.removeAtt(NOT_EXISTS_ATT);

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
