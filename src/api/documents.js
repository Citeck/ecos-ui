import Records from '../components/Records';
import { DocumentsApiRequests } from './stubs';
import ecosXhr from '../helpers/ecosXhr';

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
              att: '_type',
              val: recordRef
            },
            {
              t: 'eq',
              // att: '_etype',
              // nstead of '$ _IT' you can pass a specific type, and in this case
              // 3 argument is not needed in the Records.query function
              val: '$_IT'
            }
          ]
        },
        language: 'predicate'
      },
      // null,
      {
        // TODO: Use this after finalizing the backend
        _modified: '_modified',
        _modifier: '_modifier'
        // _modified: 'cm:modified',
        // _modifier: 'cm:modifier'
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
        loadedBy: '_modifier', // загрузил
        modified: '_modified' // обновлено
      }
    );
  };

  getFormIdByType = type => {
    // return DocumentsApiRequests.getFormIdByType();

    return Records.get(type).load('form?id');
  };

  uploadFiles = (data, handleProgress) => {
    // let record = Records.getRecordToEdit('');
    //
    // record.att('_parent', data.record);
    // record.att('_parentAtt', 'icase:documents');
    // record.att('_etype', data.type);
    // record.att('_content', data.files);
    //
    // console.warn(record)
    //
    // return record.save().then(response => response);

    console.warn('data.files => ', data.files);

    return ecosXhr('/share/proxy/alfresco/eform/file', {
      method: 'POST',
      body: {
        name: 'test',
        _content: data.files,
        _parent: data.record,
        _etype: data.type
      }
      // handleProgress
    }).then(
      response => response,
      error => {
        throw error;
      }
    );
  };
}
