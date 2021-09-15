import ActionsExecutor from '../../ActionsExecutor';
import { TasksApi } from '../../../../../../api/tasks';
import WidgetService from '../../../../../../services/WidgetService';
import { notifyFailure, notifySuccess } from '../../../util/actionUtils';
import { PREFIX_ALFRESCO } from '../../../../../../constants/alfresco';

export default class EditTaskAssignee extends ActionsExecutor {
  static ACTION_ID = 'edit-task-assignee';

  async execForRecord(record, action, context) {
    const { actionOfAssignment } = action;
    const taskId = record.id;
    const actorsPromise = TasksApi.getTask(taskId, 'actors[]?id');

    const _selectPromise = defaultValue =>
      new Promise(resolve => WidgetService.openSelectOrgstructModal({ defaultValue, onSelect: resolve }));

    const _assignPromise = owner => {
      // Temporary fix for https://citeck.atlassian.net/browse/ECOSUI-976
      if (owner && owner.indexOf(PREFIX_ALFRESCO) === 0) {
        owner = owner.slice(owner.indexOf(PREFIX_ALFRESCO) + PREFIX_ALFRESCO.length);
      }

      return owner === false
        ? Promise.resolve({ cancel: true })
        : TasksApi.staticChangeAssigneeTask({
            taskId,
            owner,
            action: actionOfAssignment
          });
    };

    return actorsPromise
      .then(_selectPromise)
      .then(_assignPromise)
      .then(answer => {
        if (answer) {
          !answer.cancel && notifySuccess();
          return answer;
        }

        return Promise.reject(answer);
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        return false;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit-task-assignee',
      icon: 'icon-edit'
    };
  }
}
