import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { StatusActionFilters } from '../../helpers/timesheet/constants';

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

  getTotalCountsByAction = ({ userName, action }) => {
    const actions = [StatusActionFilters.FILL, StatusActionFilters.APPROVE].filter(item => item !== action);

    const reqAction = actions[0];

    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' AND @timesheet:${reqAction}Delegated:true AND @timesheet:${reqAction}Deputy:${userName}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
        debug: false
      }
    }).then(res => ({ [reqAction]: res.totalCount }));
  };
}
