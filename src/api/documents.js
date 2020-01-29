import Records from '../components/Records';
import ecosXhr from '../helpers/ecosXhr';

export class DocumentsApi {
  getDocumentTypes = () => {
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

  getFormIdByType = type => {
    return Records.get(type).load('form?id');
  };

  uploadFile = (data, callback) => {
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

  getDocumentsByTypes = (recordRef = '', data = []) => {
    let types = data;

    if (typeof types === 'string') {
      types = [types];
    }

    return Records.query(
      {
        sourceId: 'alfresco/documents',
        query: {
          recordRef,
          types
        },
        language: 'types-documents'
      },
      {
        documents: 'documents[]{id:.id, name:.disp, modified:_modified, loadedBy:_modifier.fullName}',
        type: 'type'
      }
    ).then(response => response);
  };
}
