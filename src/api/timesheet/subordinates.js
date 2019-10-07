import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { TimesheetApi } from './timesheet';

const timesheetApi = new TimesheetApi();

export class TimesheetSubordinatesApi extends RecordService {
  getSubordinatesList = ({ userName }) => {
    return Records.query(
      {
        query: `@ggodic:geSupervisorId:${userName} AND (userName:1* OR userName:2*)`,
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

  getSubordinatesEventsList = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(timesheetApi.getSubordinatesList());
      }, 1500);
    });
  };
}
