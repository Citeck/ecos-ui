import { select } from 'redux-saga/effects';
import { selectDataTasksByStateId } from '../selectors/tasks';
import { selectUserFullName, selectUserUid } from '../selectors/user';
import { getIndexObjectByKV } from '../helpers/arrayOfObjects';
import { isExistIndex } from '../helpers/util';
import { AssignOptions } from '../constants/tasks';

export default class TasksService {
  static defineUserByStateAssign = function*({ stateAssign, userUid }) {
    switch (stateAssign) {
      case AssignOptions.ASSIGN_ME:
        return yield select(selectUserUid);
      case AssignOptions.UNASSIGN:
        return '';
      default:
        return userUid;
    }
  };

  static getUserFullName = function*({ stateAssign, userUid }) {
    switch (stateAssign) {
      case AssignOptions.ASSIGN_ME:
        return yield select(selectUserFullName);
      case AssignOptions.UNASSIGN:
        return '';
      default:
        return userUid;
    }
  };

  static updateList = function*({ sourceId, result }) {
    const { stateAssign, taskId } = result;
    const dataTasks = yield select(selectDataTasksByStateId, sourceId);
    const list = dataTasks && Object.keys(dataTasks).length ? dataTasks.list : [];
    const taskIndex = getIndexObjectByKV(list, 'id', taskId);
    const assignee = yield TasksService.getUserFullName({ stateAssign });

    if (isExistIndex(taskIndex)) {
      if ([AssignOptions.UNASSIGN, AssignOptions.ASSIGN_ME].includes(stateAssign)) {
        list[taskIndex] = { ...list[taskIndex], assignee, stateAssign };
      } else {
        list.splice(taskIndex, 1);
      }
    }

    return list;
  };
}
