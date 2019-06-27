import Records from '../components/Records';
import { RecordService } from './recordService';
import { TasksTestData } from './mock/tasks';

export class TasksApi extends RecordService {
  getTasks = ({ sourceId, document }) => {
    console.log('api GetTasks input', sourceId, document);
    return Records.query(
      {
        sourceId: 'wftask', //fixme: использовтаь sourceId
        query: {
          actor: '$CURRENT',
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
        assignee: 'assignee',
        sender: 'sender?json',
        lastcomment: 'lastcomment',
        reassignable: 'reassignable?bool',
        releasable: 'reassignable?bool',
        claimable: 'claimable?bool'
      }
    ).then(res => res);
  };

  changeAssigneeTask = ({ taskId, sourceId, document }) => {
    return TasksTestData.getSaveTaskResult(taskId);
  };
}
