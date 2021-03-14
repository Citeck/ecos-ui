import get from 'lodash/get';

import { TasksApi } from '../../../../../../api/tasks';
import { t } from '../../../../../../helpers/export/util';
import { USER_CURRENT } from '../../../../../../constants';
import { AssignActions, AssignTo } from '../../../../../../constants/tasks';
import { notifyFailure, notifySuccess } from '../../../util/actionUtils';
import actionsRegistry from '../../../actionsRegistry';
import ActionsExecutor from '../../ActionsExecutor';
import EditTaskAssignee from './EditTaskAssignee';

export default class SetTaskAssignee extends ActionsExecutor {
  static ACTION_ID = 'set-task-assignee';

  async execForRecord(record, recAction, context) {
    const taskId = record.id;
    const assignTo = get(recAction, 'assignTo') || '';

    let action = get(recAction, 'actionOfAssignment') || '';
    let owner = get(recAction, 'assignee') || '';

    switch (assignTo) {
      case AssignTo.ASSIGN_SMB:
        action = AssignActions.CLAIM;
        break;
      case AssignTo.ASSIGN_ME:
        action = AssignActions.CLAIM;
        owner = USER_CURRENT;
        break;
      case AssignTo.ASSIGN_GROUP:
        action = AssignActions.RELEASE;
        owner = '';
        break;
      default:
        if (!action) {
          notifyFailure(t('record-action.set-task-assignee.error.not-all-info'));
          return Promise.reject(false);
        }
        break;
    }

    if (!owner && action === AssignActions.CLAIM) {
      const editTaskAssignee = actionsRegistry.getHandler(EditTaskAssignee.ACTION_ID);

      return editTaskAssignee.execForRecord(record, {
        ...recAction,
        actionOfAssignment: action
      });
    }

    return TasksApi.staticChangeAssigneeTask({ taskId, owner, action })
      .then(answer => {
        if (answer) {
          !answer.cancel && notifySuccess();
          return answer;
        }

        return Promise.reject();
      })
      .catch(e => {
        console.error(e);
        notifyFailure(get(recAction, 'config.errorMsg') || '');
        return false;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.set-task-assignee',
      icon: 'icon-edit'
    };
  }
}
