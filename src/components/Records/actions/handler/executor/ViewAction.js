import ActionsExecutor from '../ActionsExecutor';
import { goToCardDetailsPage } from '../../../../../helpers/urls';
import { ActionModes, SourcesId } from '../../../../../constants';
import Records from '../../../Records';
import { notifyFailure } from '../../util/actionUtils';

const goToTaskView = (task, inBackground) => {
  let taskRecord = Records.get(task);

  taskRecord.load('wfm:document?id').then(docId => {
    if (docId) {
      goToCardDetailsPage(docId, { openInBackground: inBackground });
    } else {
      taskRecord.load('cm:name?str').then(taskId => {
        if (!taskId) {
          console.error('Task Id is not found!');
          notifyFailure();
          return;
        }
        const taskRecordId = `${SourcesId.TASK}@${taskId}`;
        Records.get(taskRecordId)
          .load('workflow?id')
          .then(workflowId => {
            goToCardDetailsPage(workflowId || taskRecordId, { openInBackground: inBackground });
          });
      });
    }
  });
};

export default class ViewAction extends ActionsExecutor {
  static ACTION_ID = 'view';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const inBackground = config.background === true;

    if (config.viewType === 'task-document-dashboard') {
      Records.get(record.id)
        .load('wfm:document?id')
        .then(docId => (docId ? goToCardDetailsPage(docId, { openInBackground: inBackground }) : ''));
      return false;
    } else if (config.viewType === 'view-task') {
      goToTaskView(record.id, false);
      return false;
    }

    goToCardDetailsPage(record.id, { openInBackground: inBackground });
    return false;
  }

  isAllowedInContext(context) {
    const { mode = '' } = context;
    return mode !== ActionModes.DASHBOARD;
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.show',
      icon: 'icon-small-eye-show'
    };
  }
}
