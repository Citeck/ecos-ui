import Records from '../components/Records';
import { DocumentsApiRequests } from './stubs';
import ecosXhr from '../helpers/ecosXhr';
import ecosFetch from '../helpers/ecosFetch';

export class DocumentsApi {
  getDocumentTypes = () => {
    // return DocumentsApiRequests.getDocumentTypes();

    return Records.query(
      {
        sourceId: 'emodel/type'
      },
      {
        name: 'name',
        parent: 'parent?id',
        formId: 'form?id'
      }
    ).then(response => response);
  };

  getDynamicTypes = recordRef => {
    // return DocumentsApiRequests.getDynamicTypes();

    return Records.query(
      {
        sourceId: 'alfresco/documents',
        language: 'document-types',
        query: { recordRef }
      },
      {
        type: 'type?id',
        multiple: 'multiple?bool',
        mandatory: 'mandatory?bool'
      }
    ).then(response => response);
  };

  getCountDocumentsByTypes = (recordRef, types = []) => {
    // return DocumentsApiRequests.getCountDocumentsByTypes();

    return Records.query(
      {
        sourceId: 'alfresco/',
        query: {
          t: 'and',
          val: [
            {
              t: 'eq',
              att: '_parent',
              val: recordRef
            },
            {
              t: 'eq',
              att: '_etype',
              val: '$_IT'
            }
          ]
        },
        language: 'predicate'
      },
      {
        _modified: '_modified',
        _modifier: '_modifier'
      },
      types
    ).then(response => response);
  };

  getDocumentsByType = (recordRef, type) => {
    // return DocumentsApiRequests.getDocumentsByType();

    return Records.query(
      {
        sourceId: 'alfresco/',
        query: {
          t: 'and',
          val: [
            {
              t: 'eq',
              att: '_parent',
              // in val you need to pass RecordRef from the URL
              val: recordRef
            },
            {
              t: 'eq',
              att: '_etype',
              val: type
            }
          ]
        },
        language: 'predicate'
      },
      {
        loadedBy: '_modifier',
        modified: '_modified',
        name: 'name'
      }
    );
  };

  getFormIdByType = type => {
    // return DocumentsApiRequests.getFormIdByType();

    return Records.get(type).load('form?id');
  };

  uploadFile = (data, callback = () => {}) => {
    return ecosXhr('/share/proxy/alfresco/eform/file', {
      method: 'POST',
      body: data,
      handleProgress: callback
    }).then(
      response => response,
      error => {
        throw error;
      }
    );
  };

  uploadFilesWithNodes = (data = {}) => {
    const record = Records.getRecordToEdit('dict@cm:content');

    record.att('_parent', data.record);
    record.att('_parentAtt', 'icase:documents');
    record.att('_etype', data.type);
    record.att('_content', data.content);

    return record.save().then(response => response);
  };
}
