import { RecordService } from '../recordService';
import Records from '../../components/Records';

export class TimesheetDelegatedApi extends RecordService {
  getRequestListByAction = ({ userName, action }) => {
    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' AND @timesheet:${action}Delegated:true AND @timesheet:${action}Deputy:${userName}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
        debug: false
      },
      attributes: {
        userName: 'timesheet:requestorUsername',
        status: 'timesheet:status',
        taskId: 'timesheet:currentTaskId'
      }
    }).then(res => res);
  };
}
