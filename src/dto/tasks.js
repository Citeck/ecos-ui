export default class TasksDto {
  static getTaskForWeb(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }
    let test = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam congue condimentum sem vitae pretium. Ut.';
    target.id = source.id;
    target.formId = source.formId;
    target.title = source.title + test;
    target.assignee = source.assignee + test;
    target.sender = source.sender + test;
    target.lastcomment = source.lastcomment + test;
    target.started = source.started + test;
    target.deadline = source.deadline + test;
    target.stateAssign = source.stateAssign || 1;

    return target;
  }

  static getTaskListForWeb(source = []) {
    if (Array.isArray(source)) {
      return source.map(item => TasksDto.getTaskForWeb(item));
    }

    return [];
  }
}
