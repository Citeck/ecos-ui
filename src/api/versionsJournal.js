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

  // addNewVersion = data => {
  //   const record = Records.get('version@');
  //
  //   console.warn(data);
  //
  //   record.att('version', {
  //     filedata: data.file,
  //     updateNodeRef: data.record,
  //     description: data.comment,
  //     majorversion: data.isMajor,
  //     overwrite: true
  //   });
  //
  //   return Records.file({
  //     filedata: data.file,
  //     updateNodeRef: data.record,
  //     description: data.comment,
  //     majorversion: data.isMajor,
  //     overwrite: true
  //   }).then(response => response);
  // };

  addNewVersion = data => {
    console.warn(data);

    return fetch('/share/proxy/alfresco/api/upload', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({
        filedata: data.file,
        filename: data.fileName,
        updateNodeRef: data.record,
        description: data.comment,
        majorversion: data.isMajor,
        overwrite: true
      })
    }).then(response => response.json());
  };
}
