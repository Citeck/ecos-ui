import Records from '../components/Records';

export class DocumentsApi {
  getDocumentTypes = () => {
    return Records.query(
      {
        sourceId: 'emodel/type'
      },
      {
        name: 'name',
        parent: 'parent?id'
      }
    ).then(response => response);
  };

  getDynamicTypes = recordRef => {
    return {
      records: [
        {
          id: 'alfresco/documents@123',
          type: 'emodel/type@base',
          multiple: true,
          mandatory: false
        },
        {
          id: 'alfresco/documents@125',
          type: 'emodel/type@contracts-cat-doctype-payment',
          multiple: true,
          mandatory: false
        }
      ],
      errors: [],
      hasMore: false,
      totalCount: 2
    };

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

  getDocumentsByTypes = (recordRef, types = []) => {
    return {
      records: [[], ['alfresco/@workspace://SpacesStore/bcdcee26-c1ee-429e-927b-ef2a721790de']],
      errors: [],
      hasMore: false,
      totalCount: 2
    };

    return Records.query(
      {
        sourceId: 'alfresco/',
        query: {
          t: 'and',
          val: [
            {
              t: 'eq',
              att: '_type',
              val: recordRef
            },
            {
              t: 'eq',
              att: '_etype',
              // nstead of '$ _IT' you can pass a specific type, and in this case
              // 3 argument is not needed in the Records.query function
              val: '$_IT'
            }
          ]
        },
        language: 'predicate'
      },
      null,
      types
    ).then(response => response);
  };
}
