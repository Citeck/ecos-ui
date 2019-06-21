import Records from '../components/Records';
import { RecordService } from './recordService';
import { TasksTestData } from './mock/tasks';

export class TasksApi extends RecordService {
  getTasks = ({ sourceId, recordRef }) => {
    // return TasksTestData.getTasks();
    return Records.query(
      {
        sourceId: 'wftask',
        query: {
          actor: 'admin',
          active: true
        },
        page: { maxItems: 10 }
      },
      {
        sender: 'sender',
        lastcomment: 'lastcomment',
        taskType: 'taskType',
        started: 'started',
        assignee: 'assignee',
        title: 'title'
      }
    ).then(res => res);
  };

  changeAssigneeTask = ({ taskId, sourceId, recordRef }) => {
    return TasksTestData.getSaveTaskResult();
  };
}
