import { CommonApi } from './common';
import Records from '../components/Records';
import { SourcesId } from '../constants';
import ecosXhr from '../helpers/ecosXhr';
import { PROXY_URI } from '../constants/alfresco';
import { PERMISSION_WRITE_ATTR } from '../components/Records/constants';

export class VersionsJournalApi extends CommonApi {
  getVersions = record => {
    return Records.query(
      {
        sourceId: SourcesId.VERSION,
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
        modifierId: 'modifier.id',
        avatarUrl: 'modifier.avatarUrl',
        tags: 'tags[]',
        editLink: 'editLink'
      }
    );
  };

  addNewVersion = ({ body, handleProgress }) => {
    return ecosXhr(`${PROXY_URI}api/v2/citeck/upload`, {
      method: 'POST',
      body,
      handleProgress
    }).then(
      response => response,
      error => {
        throw error;
      }
    );
  };

  setActiveVersion = ({ id, ...attributes }) => {
    const record = Records.get(id);

    record.att('revert', attributes);

    return record.save().then(response => response);
  };

  getVersionsComparison = ({ first, second }) => {
    return Records.query(
      {
        sourceId: SourcesId.VERSION_DIFF,
        query: { first, second }
      },
      { diff: 'diff' }
    ).then(response => response);
  };

  hasWritePermission = record => {
    return Records.get(record)
      .load(PERMISSION_WRITE_ATTR)
      .catch(() => false);
  };
}
