import { RecordService } from './recordService';
import { SourcesId } from '../constants';
import Records from '../components/Records';

export class BirthdaysApi extends RecordService {
  getBirthdays = () => {
    return Records.query(
      {
        sourceId: SourcesId.BIRTHDAYS
      },
      {
        userId: 'id',
        userName: 'userName',
        firstName: 'firstName',
        lastName: 'lastName',
        middleName: 'middleName',
        displayName: 'displayName',
        birthDate: 'birthDate',
        avatarUrl: 'avatarUrl'
      }
    ).then(response => response);
  };
}
