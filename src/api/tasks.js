import Records from '../components/Records';
import { RecordService } from './recordService';
import { USER_CURRENT } from '../constants';
import { SOURCE_ID_CURRENT_TASKS } from '../constants/tasks';

export class TasksApi extends RecordService {
  static getTask = (taskId, attrs) => {
    return Records.get(taskId)
      .load(attrs, true)
      .then(res => res);
  };

  static getTasks = (sourceId, document, actor, attrs) => {
    return Records.query(
      {
        sourceId,
        query: {
          actor,
          active: true,
          document
        },
        page: { skipCount: 0 }
      },
      attrs
    ).then(res => res);
  };

  getTasksForUser = ({ document }) => {
    return TasksApi.getTasks(SOURCE_ID_CURRENT_TASKS, document, USER_CURRENT, {
      formKey: '_formKey',
      title: 'title',
      started: 'started',
      dueDate: 'dueDate',
      actors: 'actors?json',
      sender: 'sender?json',
      lastcomment: 'lastcomment',
      reassignable: 'reassignable?bool',
      releasable: 'reassignable?bool',
      claimable: 'claimable?bool',
      assignable: 'assignable?bool'
    });
  };

  getCurrentTasksForUser = ({ document }) => {
    return TasksApi.getTasks(SOURCE_ID_CURRENT_TASKS, document, USER_CURRENT, {
      title: 'title',
      dueDate: 'dueDate',
      actors: 'actors?json'
    });
  };

  getTaskStateAssign = ({ taskId }) => {
    return TasksApi.getTask(taskId, {
      actors: 'actors?json',
      reassignable: 'reassignable?bool',
      releasable: 'reassignable?bool',
      claimable: 'claimable?bool',
      assignable: 'assignable?bool'
    });
  };

  changeAssigneeTask = ({ taskId, action, owner }) => {
    const record = Records.get(taskId);

    record.att('changeOwner', {
      action,
      owner
    });

    return record.save().then(res => res);
  };
}
