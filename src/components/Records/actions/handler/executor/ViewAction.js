import { goToCardDetailsPage } from '../../../../../helpers/urls';
import { ActionModes, SourcesId } from '../../../../../constants';
import Records from '../../../Records';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class ViewAction extends ActionsExecutor {
  static ACTION_ID = 'view';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const { newBrowserTab = false } = context;

    const openInBackground = config.background === true;
    const updateUrl = config.reopen === true;
    const openNewBrowserTab = newBrowserTab || config.newBrowserTab === true;
    const reopenBrowserTab = config.reopenBrowserTab === true;
    const openNewTab = openInBackground || !config.reopen;
    const openParams = {
      openInBackground,
      openNewTab,
      updateUrl,
      openNewBrowserTab,
      reopenBrowserTab
    };

    switch (true) {
      case config.viewType === 'task-document-dashboard': {
        await runViewTaskDocDashboard(record, openParams);
        return false;
      }
      case config.viewType === 'view-task': {
        await goToTaskView(record.id, openParams);
        return false;
      }
      default: {
        goToCardDetailsPage(record.id, openParams);
        return false;
      }
    }
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

const goToTaskView = async (task, params) => {
  let fixedTaskId = task;
  if (!fixedTaskId.startsWith(`${SourcesId.PROC_TASK}`)) {
    fixedTaskId = `${SourcesId.PROC_TASK}@${task}`;
  }

  let taskRecord = Records.get(fixedTaskId);

  await taskRecord.load('wfm:document?id').then(docId => {
    if (docId) {
      goToCardDetailsPage(docId, params);
    } else {
      taskRecord.load('cm:name?str').then(async taskId => {
        if (!taskId) {
          console.error('Task Id is not found!');
          notifyFailure();
          return;
        }

        let taskRecordId = `${SourcesId.PROC_TASK}@${taskId}`;
        if (taskId.indexOf('$') !== -1) {
          taskRecordId = `${SourcesId.TASK}@${taskId}`;
        }

        await Records.get(taskRecordId)
          .load('workflow?id')
          .then(workflowId => goToCardDetailsPage(workflowId || taskRecordId, params));
      });
    }
  });
};

const runViewTaskDocDashboard = async (record, openParams) => {
  await Records.get(record.id)
    .load('wfm:document?id')
    .then(docId => (docId ? goToCardDetailsPage(docId, openParams) : ''));
};
