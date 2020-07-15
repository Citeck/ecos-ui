import { PROXY_URI } from '../constants/alfresco';
import ecosFetch from '../helpers/ecosFetch';
import { t } from '../helpers/util';
import Records from '../components/Records/Records';

export class DocConstructorApi {
  getSettings = ({ name }) => {
    return ecosFetch(`${PROXY_URI}citeck/global-properties?name=${name}&format=json`)
      .then(response => (response.ok ? response.json() : Promise.reject(response)))
      .then(result => (result && result.data ? result.data : Promise.reject(result)))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error(t('doc-constructor-widget.error.get-settings')));
      });
  };

  getRecordInfo = record => {
    return Records.get(record).load({
      docOneDocumentId: 'urkk:docOneDocumentId?str',
      documentType: 'urkk:documentType?str',
      contractTemplate: 'urkk:contractTemplate?str'
    });
  };

  setContractTemplate = ({ record, templateRef }) => {
    const rec = Records.get(record);
    rec.att('urkk:contractTemplate?str', templateRef);
    return rec.save().catch(console.error);
  };

  createDocumentDocOne = ({ record }) => {
    return ecosFetch(`${PROXY_URI}citeck/ecos/create-doc-one-file-by-node-with-template?nodeRef=${record}`, { method: 'POST' })
      .then(response => (response.ok ? response.json() : Promise.reject({ message: response.statusText })))
      .then(response => (response && response.result ? response.result : Promise.reject(response)))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error(t('doc-constructor-widget.error.create-doc-one-file-by-node-with-template')));
      });
  };

  getDocumentDocOne = ({ record, docOneDocumentId }) => {
    if (Number.isNaN(docOneDocumentId) || parseInt(docOneDocumentId) <= 0) {
      return Promise.reject(new Error(t('doc-constructor-widget.error.invalid-doc-one-id')));
    }

    return ecosFetch(`${PROXY_URI}citeck/write-doc-one-content-to-node?nodeRef=${record}&id=${docOneDocumentId}`)
      .then(response => (response.ok ? response.json() : Promise.reject(response)))
      .then(response => !!(response && response.result))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error(t('doc-constructor-widget.error.write-doc-one-content-to-node')));
      });
  };

  deleteDocumentDocOne = ({ record }) => {
    return ecosFetch(`${PROXY_URI}citeck/ecos/delete-content-and-doc-one-id?nodeRef=${record}`, { method: 'DELETE' })
      .then(response => (response.ok ? response.json() : Promise.reject(response)))
      .then(response => (response && response.result ? response.result : Promise.reject(response)))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error(t('doc-constructor-widget.error.delete-content-and-doc-one-id')));
      });
  };

  setPermissionForRole = ({ record, options, docOneDocumentId }) => {
    if (Number.isNaN(docOneDocumentId) || parseInt(docOneDocumentId) <= 0) {
      return Promise.reject(new Error(t('doc-constructor-widget.error.invalid-doc-one-id')));
    }

    return ecosFetch(
      `${PROXY_URI}citeck/ecos/set-permission-for-role?nodeRef=${record}&role=${options.role}&permission=${options.permission}`,
      { method: 'POST' }
    )
      .then(response => (response.ok ? response : Promise.reject(response)))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error(t('doc-constructor-widget.error.set-permission-for-role')));
      });
  };
}
