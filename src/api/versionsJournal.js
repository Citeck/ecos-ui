import { RecordService } from './recordService';
import Records from '../components/Records';

export class VersionsJournalApi extends RecordService {
  uploadNewVersion = () => {};

  getVersions = record => {
    return Records.query(
      {
        sourceId: 'version',
        query: { record }
      },
      {
        version: 'version',
        modified: 'modified',
        firstName: 'modifier.firstName',
        lastName: 'modifier.lastName',
        downloadUrl: 'downloadUrl',
        comment: 'comment',
        name: 'name',
        logo: 'logo',
        modifierId: 'modifier.id'
      }
    ).then(response => response);
  };
}
