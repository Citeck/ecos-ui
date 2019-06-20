import Records from '../components/Records';
import { RecordService } from './recordService';
import { TasksTestData } from './mock/tasks';

export class TasksApi extends RecordService {
  getTasks = ({ sourceId, recordRef }) => {
    return TasksTestData.getTasks();
    /*return Records.get(recordRef)
      .load(attributes)
      .then(resp => resp)
      .catch(() => null);*/
  };

  changeAssigneeTask = ({ taskId, sourceId, recordRef }) => {
    return TasksTestData.getSaveTaskResult();
  };
}
