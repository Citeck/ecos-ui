import getCadespluginAPI from 'async-cadesplugin';
import get from 'lodash/get';
import set from 'lodash/set';

class EsignApi {
  static _cadespluginApi = null;

  get cadespluginApi() {
    return EsignApi._cadespluginApi;
  }

  set cadespluginApi(api) {
    EsignApi._cadespluginApi = api;
    set(window, 'cadesplugin.api', api);
  }

  get hasCadesplugin() {
    return this.cadespluginApi !== null;
  }

  getCadespluginApi = async (forcibly = false) => {
    const api = get(window, 'cadesplugin.api', null);

    if (!api || forcibly) {
      const api = await getCadespluginAPI();

      this.cadespluginApi = api;

      if (api === null) {
        throw new Error();
      }

      this.cadespluginApi = api;

      return api;
    }

    return api;
  };

  async getCertificates() {
    return await this.cadespluginApi.getValidCertificates();
  }

  getDocumentData = record => {
    return fetch(`/share/proxy/alfresco/acm/digestAndAttr?nodeRef=${record}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };

  async getSignedDocument(thumbprint, base64) {
    return await this.cadespluginApi.signBase64(thumbprint, base64);
  }

  verifySigned = async (signedMessage, signedDocument) => {
    return await this.cadespluginApi.verifyBase64(signedMessage, signedDocument);
  };

  sendSignedDocument = (nodeRef, sign, signer) => {
    return fetch('/share/proxy/alfresco/acm/digitalSignaturePut', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ nodeRef, sign, signer })
    }).then(response => response.json());
  };
}

export default new EsignApi();
