import { select } from 'redux-saga/effects';
import { isArray, isEmpty, isString } from 'lodash';
import { selectDataTasksByStateId } from '../selectors/tasks';
import { getIndexObjectByKV } from '../helpers/arrayOfObjects';
import { isExistIndex } from '../helpers/util';
import { USER_CURRENT } from '../constants';

export default class TasksService {
  static updateList = function*({ stateId, taskId, updatedFields, ownerUserName }) {
    const dataTasks = yield select(selectDataTasksByStateId, stateId);
    const list = dataTasks && Object.keys(dataTasks).length ? dataTasks.list : [];
    const taskIndex = getIndexObjectByKV(list, 'id', taskId);
    const { actors, ...stateAssign } = updatedFields;

    if (isExistIndex(taskIndex)) {
      if (USER_CURRENT === ownerUserName || ownerUserName === '') {
        list[taskIndex] = { ...list[taskIndex], actors: TasksService.getActorsDisplayNameStr(actors), stateAssign };
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
    }

    return value.displayName || '';
  }

  static getIsGroup(value) {
    if (isEmpty(value)) {
      return false;
    }

    if (isArray(value)) {
      return value.some(item => !!item.authorityName);
    }

    return !!value.authorityName;
  }

  static getUsersOfGroupStr(value) {
    if (isEmpty(value)) {
      return '';
    }

    if (isArray(value)) {
      return value.map(item => item.displayName).join('\n');
    }

    return '';
  }
}
