import { select } from 'redux-saga/effects';
import { isArray, isEmpty, isString } from 'lodash';
import { selectDataTasksByStateId } from '../selectors/tasks';
import { selectUserFullName, selectUserUid } from '../selectors/user';
import { getIndexObjectByKV } from '../helpers/arrayOfObjects';
import { isExistIndex } from '../helpers/util';
import { AssignOptions } from '../constants/tasks';

export default class TasksService {
  static defineUserByStateAssign = function*({ selectionAssign, userUid }) {
    switch (selectionAssign) {
      case AssignOptions.ASSIGN_ME:
        return yield select(selectUserUid);
      case AssignOptions.UNASSIGN:
        return '';
      default:
        return userUid;
    }
  };

  static getUserFullName = function*({ selectionAssign, userUid }) {
    switch (selectionAssign) {
      case AssignOptions.ASSIGN_ME:
        return yield select(selectUserFullName);
      case AssignOptions.UNASSIGN:
        return '';
      default:
        return userUid;
    }
  };

  static updateList = function*({ sourceId, selectionAssign, result }) {
    const { stateAssign, taskId } = result;
    const dataTasks = yield select(selectDataTasksByStateId, sourceId);
    const list = dataTasks && Object.keys(dataTasks).length ? dataTasks.list : [];
    const taskIndex = getIndexObjectByKV(list, 'id', taskId);
    const actors = yield TasksService.getUserFullName({ selectionAssign });

    if (isExistIndex(taskIndex)) {
      if ([AssignOptions.UNASSIGN, AssignOptions.ASSIGN_ME].includes(selectionAssign)) {
        list[taskIndex] = { ...list[taskIndex], actors, stateAssign };
      } else {
        list.splice(taskIndex, 1);
      }
    }

    return list;
  };

  static getActorsDisplayNameStr(value) {
    if (isEmpty(value)) {
      return '';
    }

    if (isArray(value)) {
      return value.map(item => item.displayName).join(', ');
    } else if (isString(value)) {
      return value;
    } else {
      return value.displayName;
    }
  }
}
