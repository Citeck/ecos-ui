import { RecordService } from '../recordService';
import Records from '../../components/Records';

export class TimesheetSubordinatesApi extends RecordService {
  getSubordinatesList = ({ userName }) => {
    return Records.query(
      {
        //query: `@ggodic:geSupervisorId:${userName} AND (userName:1* OR userName:2*)`,
        //Temporary relaxed query for testing TODO: switch to query above
        query: `@ggodic:geSupervisorId:${userName}`,
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
