import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { SourcesId } from '../../constants';
import { getQueryAndOrs } from './common';

export class TimesheetSubordinatesApi extends RecordService {
  getRequestListByStatus = ({ month, year, statuses, userNames }) => {
    const queryStatuses = getQueryAndOrs('@timesheet:status:', statuses);
    const queryTime = `AND @timesheet:currentYear:${year} AND @timesheet:currentMonth:${month + 1}`;
    const queryPeople = getQueryAndOrs('@timesheet:requestorUsername:', userNames);

    return Records.query(
      {
        query: `TYPE:'timesheet:Request' ${queryStatuses} ${queryTime} ${queryPeople}`,
        language: 'fts-alfresco',
        maxItems: 100,
        debug: false
      },
      {
        userName: 'timesheet:requestorUsername',
        status: 'timesheet:status?str',
        taskId: 'timesheet:currentTaskId',
        uid: 'sys:node-uuid'
      }
    );
  };

  getSubordinatesList = ({ userName }) => {
    return Records.query(
      {
        //query: `@ggodic:geSupervisorId:${userName} AND (userName:1* OR userName:2*)`,
        //Temporary relaxed query for testing TODO: switch to query above
        query: `@ggodic:geSupervisorId:${userName}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: SourcesId.PEOPLE,
        debug: false
      },
      {
        userName: 'userName',
        isAvailable: 'isAvailable',
        firstName: 'cm:firstName',
        lastName: 'cm:lastName',
        middleName: 'cm:middleName',
        firstNameRus: 'ggodic:firstNameRus',
        lastNameRus: 'ggodic:lastNameRus',
        middleNameRus: 'ggodic:middleNameRus'
      }
    );
  };
}
