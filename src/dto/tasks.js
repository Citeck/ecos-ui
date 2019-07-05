import { isArray, isEmpty } from 'lodash';
import TasksService from '../services/tasks';

export default class TasksConverter {
  static getTaskForWeb(source = {}) {
    const target = {};

    if (isEmpty(source)) {
      return target;
    }

    target.id = source.id || '';
    target.formKey = source.formKey || '';
    target.title = source.title || '';
    target.actors = TasksService.getActorsDisplayNameStr(source.actors);
    target.sender = (source.sender || {}).displayName || '';
    target.lastcomment = source.lastcomment || '';
    target.started = source.started;
    target.deadline = source.dueDate;

    const { claimable, releasable, reassignable, assignable } = source;
    target.stateAssign = { claimable, releasable, reassignable, assignable };

    return target;
  }

  static getCurrentTaskForWeb(source = {}) {
    const target = {};

    if (isEmpty(source)) {
      return target;
    }

    target.id = source.id || '';
    target.title = source.title || '';
    target.actors = TasksService.getActorsDisplayNameStr(source.actors);
    target.deadline = source.dueDate;
    target.isGroup = TasksService.getIsGroup(source.actors);
    target.actorsGroup = 'Administrator ppp\nYulia Volkova\nSomebody Else\nAnd one';

    return target;
  }

  static getTaskListForWeb(source = []) {
    if (isArray(source)) {
      return source.map(item => TasksConverter.getTaskForWeb(item));
    }

    return [];
  }

  static getCurrentTaskListForWeb(source = []) {
    if (isArray(source)) {
      return source.map(item => TasksConverter.getCurrentTaskForWeb(item));
    }

    return [];
  }
}
