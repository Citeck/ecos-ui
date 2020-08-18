import ActionsExecutor from '../ActionsExecutor';
import { goToCardDetailsPage } from '../../../../../helpers/urls';
import { ActionModes, SourcesId } from '../../../../../constants';
import Records from '../../../Records';
import { notifyFailure } from '../../util/actionUtils';

const goToTaskView = (task, params) => {
  let taskRecord = Records.get(task);

  taskRecord.load('wfm:document?id').then(docId => {
    if (docId) {
      goToCardDetailsPage(docId, params);
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
            goToCardDetailsPage(workflowId || taskRecordId, params);
          });
      });
    }
  });
};

export default class ViewAction extends ActionsExecutor {
  static ACTION_ID = 'view';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const openInBackground = config.background === true;
    const openNewTab = openInBackground || !config.reopen;
    const openParams = { openInBackground, openNewTab };

    if (config.viewType === 'task-document-dashboard') {
      Records.get(record.id)
        .load('wfm:document?id')
        .then(docId => (docId ? goToCardDetailsPage(docId, openParams) : ''));
      return false;
    } else if (config.viewType === 'view-task') {
      goToTaskView(record.id, openParams);
      return false;
    }

    goToCardDetailsPage(record.id, openParams);
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
