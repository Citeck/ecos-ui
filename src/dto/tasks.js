import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import get from 'lodash/get';

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

    const actors = source.actors || [];

    target.id = source.id || '';
    target.title = source.title || '';
    target.actors = TasksService.getActorsDisplayNameStr(actors[0]);
    target.deadline = source.dueDate;

    if (actors.length > 1) {
      target.isGroup = true;
      target.usersGroup = TasksService.getUsersOfGroupArrayStr(actors);
    } else {
      target.isGroup = TasksService.getIsGroup(actors);
      target.usersGroup = TasksService.getUsersOfGroupArrayStr(get(actors, '[0].containedUsers', []));
    }

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
