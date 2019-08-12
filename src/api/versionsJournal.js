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

  addNewVersion = data => {
    const body = new FormData();

    body.append('filedata', data.file, data.file.name);
    body.append('filename', data.file.name);
    body.append('updateNodeRef', data.record);
    body.append('description', data.comment);
    body.append('majorversion', data.isMajor);
    body.append('overwrite', 'true');

    return fetch('/share/proxy/alfresco/api/upload', {
      method: 'POST',
      credentials: 'include',
      body
    }).then(response => response.json());
  };

  setActiveVersion = data => {
    const record = Records.get(data.id);

    record.att('revert', {
      version: data.version,
      comment: data.comment,
      majorVersion: data.isMajor
    });

    return record.save().then(response => response);
  };
}
