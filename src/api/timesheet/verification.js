import { RecordService } from '../recordService';
import Records from '../../components/Records';

export class TimesheetVerificationApi extends RecordService {
  getUserNameListByStatus = ({ month, year, status }) => {
    return Records.query(
      {
        query: `TYPE:'timesheet:Request' AND @timesheet:currentYear:${year} @timesheet:currentMonth:${month} @timesheet:status:${status}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
        debug: false
      },
      {
        userName: 'timesheet:requestorUsername',
        status: 'timesheet:status',
        taskId: 'timesheet:currentTaskId'
      }
    ).then(res => res);
  };

  getInfoPeopleList = ({ userNames }) => {
    const queryNames = userNames.map(name => `@ggodic:geSupervisorId:${name}`).join(' OR ');

    return Records.query(
      {
        query: `TYPE:'cm:person' AND ${queryNames}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
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
    ).then(res => res);
  };
}
