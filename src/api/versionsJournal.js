import { RecordService } from './recordService';
import Records from '../components/Records';

export class VersionsJournalApi extends RecordService {
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

  addNewVersion = body => {
    return fetch('/share/proxy/alfresco/api/upload', {
      method: 'POST',
      credentials: 'include',
      body
    }).then(response => response.json());
  };

  setActiveVersion = ({ id, ...attributes }) => {
    const record = Records.get(id);

    record.att('revert', attributes);

    return record.save().then(response => response);
  };

  getVersionsComparison = ({ first, second }) => {
    return Records.query(
      {
        sourceId: 'version-diff',
        query: { first, second }
      },
      { diff: 'diff' }
    ).then(response => response);
  };
}
