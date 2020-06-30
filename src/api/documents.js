import Records from '../components/Records';
import { DEFAULT_REF, documentIdField } from '../constants/documents';
import { SourcesId } from '../constants';

export class DocumentsApi {
  getDocumentTypes = () => {
    return Records.query(
      {
        sourceId: SourcesId.TYPE
      },
      {
        name: 'name',
        parent: 'parent?id',
        formId: 'form?id',
        createVariants: 'createVariants?json',
        actions: 'actions[]?id'
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

  getColumnsConfigByType = typeRef => {
    return Records.queryOne(
      {
        sourceId: 'uiserv/journal',
        query: { typeRef }
      },
      '.json'
    ).then(response => response);
  };

  getFormIdByType = type => {
    return Records.get(type)
      .load('form?id')
      .then(response => response)
      .catch(() => null);
  };

  uploadFilesWithNodes = (data = {}, recordRef = DEFAULT_REF) => {
    const record = Records.getRecordToEdit(recordRef);

    Object.keys(data).forEach(key => {
      record.att(key, data[key]);
    });

    return record.save().then(response => response);
  };

  getDocumentsByTypes = (recordRef = '', data = [], attributes = '') => {
    const baseAttrs = `${documentIdField}:id,__name:att(n:"name"){disp},__modified:att(n:"_modified"){disp},__loadedBy:att(n:"_modifier"){disp}`;

    let types = data;
    // let query = 'documents[]{id:.id, name:.disp, modified:_modified, loadedBy:_modifier.fullName}';

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
        documents: `.atts(n:"documents"){${[baseAttrs, attributes].join(',')}}`,
        type: 'type'
      }
    ).then(response => response);
  };

  getCreateVariants = type => {
    return Records.get(type)
      .load('createVariants?json')
      .then(response => response || {})
      .catch(() => null);
  };
}
