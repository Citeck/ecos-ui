import { PROXY_URI } from '../constants/alfresco';
import ecosFetch from '../helpers/ecosFetch';
import Records from '../components/Records/Records';

export class DocConstructorApi {
  getSettings = ({ name }) => {
    return ecosFetch(`${PROXY_URI}citeck/global-properties?name=${name}`).then(response =>
      response.ok ? response.text() : Promise.reject({ message: response.statusText })
    );
    //todo response.json()
  };

  getRecordInfo = record => {
    return Records.get(record).load({
      docOneDocumentId: 'urkk:docOneDocumentId?str',
      documentType: 'urkk:documentType?str',
      contractTemplate: 'urkk:contractTemplate?str',
      attorneyTemplate: 'urkk:attorneyTemplate?str'
    });
  };

  setContractTemplate = ({ record, templateRef }) => {
    const rec = Records.get(record);
    rec.att('urkk:contractTemplate?str', templateRef);
    return rec.save().catch(console.error);
  };

  createDocumentByeDocOne = ({ record }) => {
    return ecosFetch(`${PROXY_URI}citeck/unilever/create-doc-one-file-by-node-with-template?nodeRef=${record}`, { method: 'POST' })
      .then(response => (response.ok ? response.json() : Promise.reject({ message: response.statusText })))
      .then(result => (result ? result : Promise.reject(result)))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error('doc-constructor-widget.error.create-doc-one-file-by-node-with-template'));
      });
  };

  setPermissionForRole = ({ record, options }) => {
    return ecosFetch(
      `${PROXY_URI}citeck/unilever/set-permission-for-role?nodeRef=${record}&role=${options.role}&permission=${options.permission}`,
      { method: 'POST' }
    )
      .then(response => (response.ok ? response : Promise.reject(response)))
      .catch(e => {
        console.error(e);
        return Promise.reject(new Error('doc-constructor-widget.error.set-permission-for-role'));
      });
  };
}
