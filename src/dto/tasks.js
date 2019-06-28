export default class TasksConverter {
  static TaskWebDto = () => ({
    id: '',
    formKey: '',
    title: '',
    sender: '',
    assignee: '',
    candidate: '',
    lastcomment: '',
    started: '',
    deadline: '',
    stateAssign: {
      claimable: false,
      releasable: false,
      reassignable: false
    }
  });

  static TaskServerDto = () => ({
    id: '',
    formKey: '',
    title: '',
    sender: {
      displayName: ''
    },
    assignee: {
      displayName: ''
    },
    candidate: {
      displayName: ''
    },
    lastcomment: '',
    started: '',
    dueDate: '',
    claimable: false,
    releasable: false,
    reassignable: false
  });

  static getTaskForWeb(data = {}) {
    const target = TasksConverter.TaskWebDto();
    const source = { ...TasksConverter.TaskServerDto(), ...data };

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.id = source.id || '';
    target.formKey = source.formKey || '';
    target.title = source.title || '';
    target.candidate = (source.candidate || {}).displayName || '';
    target.sender = (source.sender || {}).displayName || '';
    target.lastcomment = source.lastcomment || '';
    target.started = source.started;
    target.deadline = source.dueDate;

    const { claimable, releasable, reassignable } = source;
    target.stateAssign = { claimable, releasable, reassignable };

    return target;
  }

  static getTaskListForWeb(source = []) {
    if (Array.isArray(source)) {
      return source.map(item => TasksConverter.getTaskForWeb(item));
    }

    return [];
  }
}
