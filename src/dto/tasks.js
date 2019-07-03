import TasksService from '../services/tasks';

export default class TasksConverter {
  static getTaskForWeb(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
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

  static getTaskListForWeb(source = []) {
    if (Array.isArray(source)) {
      return source.map(item => TasksConverter.getTaskForWeb(item));
    }

    return [];
  }
}
