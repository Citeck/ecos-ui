import Records from '../components/Records';
import { RecordService } from './recordService';
import { USER_CURRENT } from '../constants';

export class TasksApi extends RecordService {
  getTasks = ({ sourceId, document }) => {
    return Records.query(
      {
        sourceId,
        query: {
          actor: USER_CURRENT,
          active: true,
          document
        },
        page: { skipCount: 0 }
      },
      {
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
      }
    ).then(res => res);
  };

  getTask = (taskId, attrs) => {
    return Records.get(taskId)
      .load(attrs, true)
      .then(res => res);
  };

  getTaskStateAssign = ({ taskId }) => {
    return this.getTask(taskId, {
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
