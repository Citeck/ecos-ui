import Records from '../components/Records';
import { DEFAULT_REF, documentFields } from '../constants/documents';
import { Permissions, SourcesId } from '../constants';
import GqlDataSource from '../components/common/grid/dataSource/GqlDataSource';
import { PROXY_URI } from '../constants/alfresco';

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
    const baseAttrs = `${documentFields.id}:id,${documentFields.name}:att(n:"name"){disp},${
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
    ).then(response => response);
  };

  getCreateVariants = type => {
    return Records.get(type)
      .load('createVariants?json')
      .then(response => response || {})
      .catch(() => null);
  };

  getFormattedColumns = async config => {
    const { predicate = {}, columns = [], sourceId } = config;
    const queryPredicates = predicate.val || [];
    const bodyQuery = {
      query: {
        t: 'and',
        val: queryPredicates.concat(
          (predicate.val || []).filter(item => {
            return item.val !== '' && item.val !== null;
          })
        )
      },
      language: 'predicate',
      consistency: 'EVENTUAL'
    };

    if (sourceId) {
      bodyQuery['sourceId'] = sourceId;
    }

    const dataSource = new GqlDataSource({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: bodyQuery
        }
      },
      columns: columns || [],
      permissions: [Permissions.Write]
    });

    await dataSource.load();

    return dataSource.getColumns();
  };
}
