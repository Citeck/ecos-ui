import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { StatusActionFilters, TimesheetTypes } from '../../helpers/timesheet/constants';
import CommonTimesheetService from '../../services/timesheet/common';

function getQueryStatuses(action) {
  const expectedStatuses = CommonTimesheetService.getAllowedStatusKeys(TimesheetTypes.DELEGATED, action);
  const queryStatuses = expectedStatuses && expectedStatuses.map(status => `@timesheet:status:${status}`).join(' OR ');

  if (!queryStatuses) {
    return '';
  }

  return `AND (${queryStatuses})`;
}

export class TimesheetDelegatedApi extends RecordService {
  getRequestListByAction = ({ userName, action, year, month }) => {
    const queryAction = `AND @timesheet:${action}Delegated:true AND @timesheet:${action}Deputy:${userName}`;
    const queryStatuses = getQueryStatuses(action);
    const queryTime = `AND @timesheet:currentYear:${year} AND @timesheet:currentMonth:${month + 1}`;

    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' ${queryAction} ${queryStatuses} ${queryTime}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
        debug: false
      },
      attributes: {
        userName: 'timesheet:requestorUsername',
        status: 'timesheet:status?str',
        taskId: 'timesheet:currentTaskId',
        uid: 'sys:node-uuid'
      }
    }).then(res => res);
  };

  getTotalCountsByAction = ({ userName, action }) => {
    const actions = [StatusActionFilters.FILL, StatusActionFilters.APPROVE].filter(item => item !== action);

    const reqAction = actions[0];
    const queryAction = `AND @timesheet:${reqAction}Delegated:true AND @timesheet:${reqAction}Deputy:${userName}`;
    const queryStatuses = getQueryStatuses(reqAction);

    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' ${queryAction} ${queryStatuses}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
        debug: false
      },
      attributes: { id: 'id' }
    }).then(res => ({ [reqAction]: res.totalCount }));
  };
}
