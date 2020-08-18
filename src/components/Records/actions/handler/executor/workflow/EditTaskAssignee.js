import ActionsExecutor from '../../ActionsExecutor';
import { TasksApi } from '../../../../../../api/tasks';
import WidgetService from '../../../../../../services/WidgetService';
import { notifySuccess, notifyFailure } from '../../../util/actionUtils';

export default class EditTaskAssignee extends ActionsExecutor {
  static ACTION_ID = 'edit-task-assignee';

  async execForRecord(record, action, context) {
    const { actionOfAssignment } = action;

    const taskId = record.id;

    const actorsPromise = TasksApi.getTask(taskId, 'actors[]?id');

    const _selectPromise = defaultValue =>
      new Promise(resolve => WidgetService.openSelectOrgstructModal({ defaultValue, onSelect: resolve }));

    const _assignPromise = owner => TasksApi.staticChangeAssigneeTask({ taskId, owner, action: actionOfAssignment });

    return actorsPromise
      .then(_selectPromise)
      .then(_assignPromise)
      .then(success => {
        if (success) {
          notifySuccess();
          return success;
        }

        return Promise.reject();
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
