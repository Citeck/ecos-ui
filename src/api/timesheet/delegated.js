import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { DelegationTypes, TimesheetSourcesId, TimesheetTypes } from '../../constants/timesheet';
import CommonTimesheetService from '../../services/timesheet/common';
import { SourcesId } from '../../constants';

function getQueryStatuses(delegationType) {
  const expectedStatuses = CommonTimesheetService.getAllowedStatusKeys(TimesheetTypes.DELEGATED, delegationType);
  const queryStatuses = expectedStatuses && expectedStatuses.map(status => `@timesheet:status:${status}`).join(' OR ');

  if (!queryStatuses) {
    return '';
  }

  return `AND (${queryStatuses})`;
}

export class TimesheetDelegatedApi extends RecordService {
  getRequestListByType = ({ userName, delegationType, year, month }) => {
    const queryType = `AND @timesheet:${delegationType}Delegated:true AND @timesheet:${delegationType}Deputy:${userName}`;
    const queryStatuses = getQueryStatuses(delegationType);
    const queryTime = `AND @timesheet:currentYear:${year} AND @timesheet:currentMonth:${month + 1}`;

    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' ${queryType} ${queryStatuses} ${queryTime}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: SourcesId.PEOPLE,
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

  getTotalCountsByType = ({ userName, delegationType }) => {
    const delegationTypes = [DelegationTypes.FILL, DelegationTypes.APPROVE].filter(item => item !== delegationType);

    const reqType = delegationTypes[0];
    const queryType = `AND @timesheet:${reqType}Delegated:true AND @timesheet:${reqType}Deputy:${userName}`;
    const queryStatuses = getQueryStatuses(reqType);

    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' ${queryType} ${queryStatuses}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: SourcesId.PEOPLE,
        debug: false
      },
      attributes: { id: 'id' }
    }).then(res => ({ [reqType]: res.totalCount }));
  };

  getRecords = ({ userName, deputyName, delegationType }) => {
    return Records.query(
      {
        query: {
          user: userName,
          deputy: deputyName,
          delegationType: delegationType
        },
        sourceId: TimesheetSourcesId.DELEGATION,
        language: 'json'
      },
      {
        nodeRef: 'nodeRef'
      }
    ).then(res => res);
  };

  setRecord = ({ userName, deputyName, delegationType }) => {
    var delegation = Records.get(`${TimesheetSourcesId.DELEGATION}@`);

    delegation.att('user', userName);
    delegation.att('deputy', deputyName);
    delegation.att('delegationType', delegationType);

    return delegation.save().then(res => res);
  };

  removeRecord = ({ userName, deputyName, delegationType }) => {
    return Records.remove([`${TimesheetSourcesId.DELEGATION}@${userName}-${deputyName}-${delegationType}`]).then(res => res);
  };
}
