import get from 'lodash/get';

import ActionsExecutor from '../ActionsExecutor';
import dialogManager from '../../../../common/dialogs/Manager/DialogManager';
import Records from '../../../Records';
import { isExistValue } from '../../../../../helpers/util';

export default class DeleteAction extends ActionsExecutor {
  static ACTION_ID = 'delete';

  async execForRecord(record, action, context) {
    return this.execForRecords([record], action, context);
  }

  async execForRecords(records, action, context) {
    const withoutConfirm = get(action, 'config.withoutConfirm', false);
    const isWaitResponse = isExistValue(get(action, 'config.isWaitResponse')) ? action.config.isWaitResponse : true;
    let dialogTitle, dialogText;

    if (records.length === 1) {
      dialogTitle = 'record-action.delete.dialog.title.remove-one';
      dialogText = 'record-action.delete.dialog.msg.remove-one';
    } else {
      dialogTitle = 'record-action.delete.dialog.title.remove-many';
      dialogText = 'record-action.delete.dialog.msg.remove-many';
    }

    if (withoutConfirm) {
      return new Promise(resolve => {
        Records.remove(records)
          .then(() => {
            resolve(true);
          })
          .catch(e => {
            dialogManager.showInfoDialog({
              title: 'record-action.delete.dialog.title.error',
              text: e.message || 'record-action.delete.dialog.msg.error',
              onClose: () => {
                resolve(false);
              }
            });
            console.error(e);
          });
      });
    }

    return new Promise(resolve => {
      dialogManager.showRemoveDialog({
        title: dialogTitle,
        text: dialogText,
        isWaitResponse,
        onDelete: async () => {
          await Records.remove(records)
            .then(() => {
              resolve(true);
            })
            .catch(e => {
              dialogManager.showInfoDialog({
                title: 'record-action.delete.dialog.title.error',
                text: e.message || 'record-action.delete.dialog.msg.error',
                onClose: () => {
                  resolve(false);
                }
              });
              console.error(e);
            });
        },
        onCancel: () => {
          resolve(false);
        }
      });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.delete',
      icon: 'icon-delete',
      theme: 'danger'
    };
  }
}
