import { AssignOptions } from '../constants/tasks';

export default class TasksDto {
  static getTaskForWeb(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.id = source.id;
    target.formId = source.formId;
    target.title = source.title;
    target.assignee = source.assignee;
    target.sender = source.sender;
    target.lastcomment = source.lastcomment;
    target.started = source.started;
    target.deadline = source.deadline;
    target.stateAssign = source.stateAssign || AssignOptions.UNASSIGN;

    return target;
  }

  static getTaskListForWeb(source = []) {
    if (Array.isArray(source)) {
      return source.map(item => TasksDto.getTaskForWeb(item));
    }

    return [];
  }
}
