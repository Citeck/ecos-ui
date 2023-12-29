import Records from '../components/Records';
import { documentFields } from '../constants/documents';
import { SourcesId } from '../constants';
import journalsService from '../components/Journals/service/journalsService';

export class DocumentsApi {
  getDocumentTypes = () => {
    return Records.query(
      {
        sourceId: SourcesId.TYPE,
        query: {},
        language: 'predicate'
      },
      {
        name: 'name',
        parent: 'parent?id'
      }
    );
  };

  getTypeInfo = (id, loadData) => {
    const types = Array.isArray(id) ? id : [id];

    return Records.get(types).load(
      loadData || {
        name: 'name',
        formId: 'form?id',
        createVariants: 'inhCreateVariants[]?json',
        actions: 'actions[]?id'
      }
    );
  };

  getParent = type => {
    return Records.get(type).load({
      id: 'parent?id',
      name: 'parent?disp'
    });
  };

  getDynamicTypes = recordRef => {
    return Records.query(
      {
        sourceId: SourcesId.DOCUMENTS,
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
      .catch(() => null);
  };

  uploadFilesWithNodes = (data = {}, recordRef) => {
    const record = Records.getRecordToEdit(recordRef);

    Object.keys(data).forEach(key => {
      record.att(key, data[key]);
    });

    return record.save();
  };

  downloadAllDocumentsWithAlfresco = documentsRefs => {
    return fetch('/alfresco/s/citeck/zip/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;odata=verbose'
      },
      body: JSON.stringify({
        documentsRef: documentsRefs
      })
    })
      .then(res => res.blob())
      .then(blob => {
        var file = window.URL.createObjectURL(blob);
        window.location.assign(file);
      });
  };

  getDocumentsByTypes = (recordRef = '', data = [], attributes = {}) => {
    const baseAttrs = {
      recordRef: '?id',
      [documentFields.id]: '?id',
      [documentFields.name]: '?disp',
      [documentFields.modified]: '_modified',
      [documentFields.loadedBy]: '_modifier',
      ...attributes
    };
    let attsToRequestStr = '';
    for (let alias in baseAttrs) {
      attsToRequestStr += alias + ':' + baseAttrs[alias] + ',';
    }
    // remove last comma
    attsToRequestStr = attsToRequestStr.substring(0, attsToRequestStr.length - 1);

    let types = data;
    if (typeof types === 'string') {
      types = [types];
    }
    return Records.query(
      {
        sourceId: SourcesId.DOCUMENTS,
        query: {
          recordRef,
          types
        },
        language: 'types-documents'
      },
      {
        documents: `documents[]{${attsToRequestStr}}`,
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
