import { goToCardDetailsPage } from '../../../../../helpers/urls';
import { ActionModes, SourcesId } from '../../../../../constants';
import Records from '../../../Records';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';
import MenuSettingsService from '../../../../../services/MenuSettingsService';
import { t } from '../../../../../helpers/export/util';

export default class ViewAction extends ActionsExecutor {
  static ACTION_ID = 'view';

  async execForRecord(record, action, context) {
    const { config = {} } = action;
    const openInBackground = config.background === true;
    const updateUrl = config.reopen === true;
    const openNewBrowserTab = config.newBrowserTab === true;
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
        runViewTaskDocDashboard(record, openParams);
        return false;
      }
      case config.viewType === 'view-task': {
        goToTaskView(record.id, openParams);
        return false;
      }
      case record.id.includes(SourcesId.MENU): {
        await runViewMenu(record);
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

function runViewTaskDocDashboard(record, openParams) {
  Records.get(record.id)
    .load('wfm:document?id')
    .then(docId => (docId ? goToCardDetailsPage(docId, openParams) : ''));
}

async function runViewMenu(record) {
  const version = await record.load('version?str');

  if (Number(version) > 0) {
    MenuSettingsService.emitter.emit(MenuSettingsService.Events.SHOW, { recordId: record.id, disabledEdit: true });
  } else {
    notifyFailure(t('menu-settings.error.view-version-not-available', { version }));
  }
}
