import Records from '../components/Records';
import { RecordService } from './recordService';
import { SourcesId, USER_CURRENT } from '../constants';

export class TasksApi extends RecordService {
  static getTask = (taskId, attrs) => {
    return Records.get(taskId)
      .load(attrs, true)
      .then(res => res);
  };

  static getTasks = (sourceId, document, actor, attrs) => {
    if (document) {
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
    }

    return { records: [] };
  };

  static getStaticTaskStateAssignee = ({ taskId }) => {
    return TasksApi.getTask(taskId, {
      actors: 'actors[]?json',
      reassignable: 'reassignable?bool',
      releasable: 'releasable?bool',
      claimable: 'claimable?bool',
      assignable: 'assignable?bool'
    });
  };

  getTasksForUser = ({ document }) => {
    return TasksApi.getTasks(SourcesId.TASK, document, USER_CURRENT, {
      formKey: '_formKey?str',
      title: 'title',
      started: 'started',
      dueDate: 'dueDate',
      actors: 'actors[]?json',
      sender: 'sender?json',
      lastcomment: 'lastcomment',
      reassignable: 'reassignable?bool',
      releasable: 'releasable?bool',
      claimable: 'claimable?bool',
      assignable: 'assignable?bool'
    });
  };

  getCurrentTasksForUser = ({ document }) => {
    return TasksApi.getTasks(SourcesId.TASK, document, undefined, {
      title: 'title',
      dueDate: 'dueDate',
      actors: 'actors[]?json'
    });
  };

  getTaskStateAssign = ({ taskId }) => TasksApi.getStaticTaskStateAssignee({ taskId });

  getDocumentByTaskId = taskId => TasksApi.getDocument(taskId);

  static getDocument = taskId => {
    return Records.get(taskId)
      .load('document?id')
      .then(res => res);
  };

  /**
   * @description do not use directly; Execute with action service (SET_TASK_ASSIGNEE)
   */
  static staticChangeAssigneeTask = ({ taskId, action, owner }) => {
    const record = Records.get(taskId);

    record.att('changeOwner', {
      action,
      owner
    });

    return record
      .save()
      .then(() => ({ action, owner }))
      .catch(console.error);
  };
}
