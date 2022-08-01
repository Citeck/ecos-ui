import { select } from 'redux-saga/effects';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import get from 'lodash/get';
import { selectStateTasksById } from '../selectors/tasks';
import { getIndexObjectByKV } from '../helpers/arrayOfObjects';
import { isExistIndex } from '../helpers/util';
import { USER_CURRENT } from '../constants';
import { GROUP_PREFIX } from './authrority/AuthorityService';

export default class TasksService {
  static updateList = function*({ stateId, taskId, updatedFields, ownerUserName }) {
    const dataTasks = yield select(selectStateTasksById, stateId);
    const list = get(dataTasks, 'list', []);
    const taskIndex = getIndexObjectByKV(list, 'id', taskId);
    const { actors, ...stateAssign } = updatedFields;
    let totalCount = get(dataTasks, 'totalCount', list.length);

    if (isExistIndex(taskIndex)) {
      if (USER_CURRENT === ownerUserName || ownerUserName === '') {
        list[taskIndex] = { ...list[taskIndex], actors: TasksService.getActorsDisplayNameStr(actors), stateAssign };
      } else {
        list.splice(taskIndex, 1);
        totalCount = totalCount - 1;
      }
    }

    return { list, totalCount };
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
      return value.some(item => this.isGroupAuthorityName(item.authorityName));
    }

    return this.isGroupAuthorityName(value.authorityName);
  }

  static isGroupAuthorityName(authorityName) {
    if (!authorityName) {
      return false;
    }

    return authorityName.startsWith(GROUP_PREFIX);
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

  static getUsersOfGroupArrayStr(value) {
    if (isEmpty(value)) {
      return [];
    }

    if (isArray(value)) {
      return value.map(item => item.displayName);
    }

    return [];
  }
}
