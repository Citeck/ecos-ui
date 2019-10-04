import { RecordService } from '../recordService';
import Records from '../../components/Records';

export class TimesheetCommonApi extends RecordService {
  getTimesheetStatusList = ({ month, year, userNames }) => {
    return Records.query(
      {
        query: { month, year, userNames },
        language: 'json',
        maxItems: 100,
        sourceId: 'timesheet-status',
        debug: false
      },
      {
        userName: 'username',
        status: 'status',
        taskId: 'taskId'
      }
    ).then(res => res);
  };
}
