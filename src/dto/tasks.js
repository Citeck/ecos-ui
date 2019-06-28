import TasksService from '../services/tasks';

const TaskWebDto = () => ({
  id: '',
  formKey: '',
  title: '',
  sender: '',
  actors: '',
  lastcomment: '',
  started: '',
  deadline: '',
  stateAssign: {
    claimable: false,
    releasable: false,
    reassignable: false
  }
});

const TaskServerDto = () => ({
  id: '',
  formKey: '',
  title: '',
  sender: {
    displayName: ''
  },
  actors: {
    displayName: ''
  },
  lastcomment: '',
  started: '',
  dueDate: '',
  claimable: false,
  releasable: false,
  reassignable: false
});

export default class TasksConverter {
  static getTaskForWeb(data = {}) {
    const target = TaskWebDto();
    const source = { ...TaskServerDto(), ...data };

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
