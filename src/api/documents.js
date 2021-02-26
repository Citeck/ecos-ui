import Records from '../components/Records';
import { DEFAULT_REF, documentFields } from '../constants/documents';
import { SourcesId } from '../constants';
import journalsService from '../components/Journals/service/journalsService';

export class DocumentsApi {
  getDocumentTypes = () => {
    return Records.query(
      {
        sourceId: SourcesId.TYPE
      },
      {
        name: 'name',
        parent: 'parent?id'
        // formId: 'form?id',
        // createVariants: 'inhCreateVariants[]?json',
        // actions: 'actions[]?id'
      }
    ).then(response => response);
  };

  getTypeInfo = (id, loadData) => {
    const types = Array.isArray(id) ? id : [id];

    return Records.get(types)
      .load(
        loadData || {
          name: 'name',
          formId: 'form?id'
        }
      )
      .then(response => response);
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
    );
  };

  getColumnsConfigByType = typeRef => {
    return journalsService.getJournalConfigByType(typeRef);
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
    const baseAttrs = `recordRef:id,${documentFields.id}:id,${documentFields.name}:att(n:"name"){disp},${
      documentFields.modified
    }:att(n:"_modified"){disp},${documentFields.loadedBy}:att(n:"_modifier"){disp}`;

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
        documents: `.atts(n:"documents"){${[baseAttrs, attributes].join(',')}}`,
        type: 'type'
      }
    );
  };

  getCreateVariants = type => {
    return Records.get(type)
      .load('createVariants?json')
      .then(response => response || {})
      .catch(() => null);
  };
}
