import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { DelegationTypes, TimesheetSourcesId, TimesheetTypes } from '../../constants/timesheet';
import CommonTimesheetService from '../../services/timesheet/common';
import { SourcesId } from '../../constants';
import { getQueryAndOrs } from './common';

function getQueryStatuses(delegationType) {
  const expectedStatuses = CommonTimesheetService.getAllowedStatusKeys(TimesheetTypes.DELEGATED, delegationType);

  return getQueryAndOrs('@timesheet:status:', expectedStatuses);
}

export class TimesheetDelegatedApi extends RecordService {
  getRequestListByType = ({ userName, delegationType, year, month, statuses }) => {
    const queryType = `AND @timesheet:${delegationType}Delegated:true AND @timesheet:${delegationType}Deputy:${userName}`;
    const queryStatuses = getQueryAndOrs('@timesheet:status:', statuses);
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

  getTotalCountByType = ({ userName, delegationType, year, month }) => {
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
      attributes: { _tc: '_tc' }
    }).then(res => (res ? res.totalCount : 0));
  };

  getTotalCountsForTypes = async ({ userName, year, month }) => {
    const delegationTypes = [DelegationTypes.FILL, DelegationTypes.APPROVE];
    const counts = {};

    for (let delegationType of delegationTypes) {
      counts[delegationType] = await this.getTotalCountByType({ userName, delegationType, year, month });
    }

    return counts;
  };

  getDeputyList = ({ userName, type }) => {
    return Records.query({
      query: {
        query: `TYPE:'timesheetdl:${type}' AND @timesheetdl:deputyUsername:${userName}`,
        language: 'fts-alfresco',
        maxItems: 100,
        debug: false
      },
      attributes: {
        userName: 'timesheetdl:delegatorUsername',
        userFullName: 'timesheetdl:delegator'
      }
    }).then(res => res);
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
    const delegation = Records.get(`${TimesheetSourcesId.DELEGATION}@`);

    delegation.att('user', userName);
    delegation.att('deputy', deputyName);
    delegation.att('delegationType', delegationType);

    return delegation.save().then(res => res);
  };

  removeRecord = ({ userName, deputyName, delegationType }) => {
    if (Array.isArray(deputyName)) {
      deputyName.forEach(item => {
        Records.remove([`${TimesheetSourcesId.DELEGATION}@${userName}-${deputyName}-${delegationType}`]).then(res => res);
      });
    } else {
      return Records.remove([`${TimesheetSourcesId.DELEGATION}@${userName}-${deputyName}-${delegationType}`]).then(res => res);
    }
  };

  getDelegationInfo = ({ user, delegationType }) => {
    return Records.query(
      {
        query: { user, delegationType },
        sourceId: 'timesheet-delegation',
        language: 'json'
      },
      {
        deputyNodeRef: 'deputyNodeRef',
        deputyUsername: 'deputyUsername',
        delegationType: 'delegationType',
        firstName: 'firstName',
        lastName: 'lastName',
        displayName: 'displayName'
      }
    ).then(res => res);
  };
}
