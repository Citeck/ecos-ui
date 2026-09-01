import { SourcesId } from '@citeck/constants';
import { PROXY_URI } from '@citeck/constants/alfresco';
import Records from '@citeck/records-core';
import { IS_CONTENT_PROTECTED_ATTR, PERMISSION_WRITE_ATTR } from '@citeck/records-core/constants';

import ecosXhr from '../helpers/ecosXhr';

import { CommonApi } from './common';

import { uploadContent } from '@/helpers/chunkedUpload';

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
    const { record, file, comment, isMajor, formData } = body;

    if ((record || '').indexOf('workspace://SpacesStore/') !== -1) {
      // Legacy Alfresco branch: a single multipart POST to the old citeck/upload endpoint.
      return ecosXhr(`${PROXY_URI}api/v2/citeck/upload`, {
        method: 'POST',
        body: formData,
        handleProgress
      }).then(
        response => response,
        error => {
          throw error;
        }
      );
    }

    // emodel branch: upload the raw file through the chunked-upload module to get a temp-file
    // ref, then perform the record mutation `ContentVersionController.handleFileUpload` performs
    // server-side (`recordsService.mutate(entityRef, {"version:version", "version:comment",
    // "_content"})`); `sagaUpdateVersion` in src/sagas/documents.js does the same client-side.
    // `att()` is a setter, not a chainable builder — it returns the written value, not `this` —
    // so the mutation is three separate `.att()` calls followed by `.save()`.
    //
    // The server's ACL write check and checkout listener both fire on the generic mutate path, so
    // a caller without write permission, or a record checked out by someone else, gets a
    // rejection straight from `.save()` below, propagated to the caller unchanged.
    return uploadContent(file, { handleProgress }).then(({ entityRef }) => {
      const updatedRecord = Records.get(record);

      updatedRecord.att('_content', entityRef);
      updatedRecord.att('version:version', isMajor ? '+1.0' : '+0.1');
      updatedRecord.att('version:comment', comment);

      return updatedRecord.save().then(() => ({
        // Legacy-response-shaped so the existing saga's `result.status.code === 200` check
        // (src/sagas/versionsJournal.js) and mapDispatchToProps wiring keep working unmodified.
        status: { code: 200, name: 'OK', description: 'File uploaded successfully' }
      }));
    });
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

  hasWritePermission = async record => {
    try {
      const hasWrite = await Records.get(record).load(PERMISSION_WRITE_ATTR);
      const isContentProtected = await Records.get(record).load(IS_CONTENT_PROTECTED_ATTR);

      return hasWrite && !isContentProtected;
    } catch (_error) {
      return false;
    }
  };
}
