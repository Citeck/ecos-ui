import { RecordService } from '../recordService';
import Records from '../../components/Records';

export class TimesheetVerificationApi extends RecordService {
  getRequestListByStatus = ({ month, year, status }) => {
    return Records.query(
      {
        query: `TYPE:'timesheet:Request' AND @timesheet:currentYear:${year} AND @timesheet:currentMonth:${month +
          1} AND @timesheet:status:${status}`,
        language: 'fts-alfresco',
        maxItems: 100,
        debug: false
      },
      {
        userName: 'timesheet:requestorUsername',
        status: 'timesheet:status?str',
        taskId: 'timesheet:currentTaskId'
      }
    ).then(res => res);
  };
}
