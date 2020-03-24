import Records from '../components/Records';

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
    return Records.get(type)
      .load('form?id')
      .then(response => response)
      .catch(() => null);
  };

  uploadFilesWithNodes = (data = {}) => {
    const record = Records.getRecordToEdit('dict@cm:content');

    Object.keys(data).forEach(key => {
      record.att(key, data[key]);
    });

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

  getCreateVariants = type => {
    return Records.get(type)
      .load('createVariants?json')
      .then(response => response)
      .catch(() => null);
  };
}
