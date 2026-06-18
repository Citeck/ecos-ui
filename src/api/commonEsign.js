import { PROXY_URI } from '../constants/alfresco';

class CommonEsignApi {
  getDocumentData = record => {
    return fetch(`${PROXY_URI}acm/digestAndAttr?nodeRef=${record}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };

  sendSignedDocument = (body = {}) => {
    return fetch(`${PROXY_URI}acm/digitalSignaturePut`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body)
    }).then(response => response.json());
  };

  getDataForSignFromProvider = (record, provider, actionType, direction, comment) => {
    return fetch(
      `${PROXY_URI}citeck/document-info-for-sign?nodeRef=${record}&provider=${provider}&actionType=${actionType}&direction=${direction}&comment=` +
        encodeURIComponent(comment),
      {
        method: 'GET',
        credentials: 'include'
      }
    ).then(response => response.json());
  };
}

export default new CommonEsignApi();
