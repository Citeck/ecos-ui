import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';

import TasksService from '../services/tasks';

import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';

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
    target.lastcomment = EcosFormUtils.stripHTML(source.lastcomment || '');
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

    const actors = cloneDeep(source.actors) || [];

    target.id = source.id || '';
    target.title = source.title || '';
    target.actors = TasksService.getActorsDisplayNameStr(actors[0]);
    target.deadline = source.dueDate;
    target.hasPermissionReassign = !!source.hasPermissionReassign;
    target.canReadDef = source.canReadDef;

    if (source.actors.length > 1) {
      actors.shift();
      target.isGroup = true;
      target.usersGroup = TasksService.getUsersOfGroupArrayStr(actors);
      target.count = `+ ${target.usersGroup.length}`;
    } else {
      target.isGroup = TasksService.getIsGroup(actors);
      target.usersGroup = TasksService.getUsersOfGroupArrayStr(get(actors, '[0].containedUsers', []));
      target.count = target.usersGroup.length && !target.isGroup ? `+ ${target.usersGroup.length - 1}` : target.usersGroup.length;
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
