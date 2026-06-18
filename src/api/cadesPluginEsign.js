import getCadespluginAPI from 'async-cadesplugin';
import get from 'lodash/get';
import set from 'lodash/set';

class CadespluginEsignApi {
  static _cadespluginApi = null;

  constructor() {
    /**
     * Disable standard notifications from the plugin
     */
    set(window, 'cadesplugin_skip_extension_install', true);
  }

  get cadespluginApi() {
    return CadespluginEsignApi._cadespluginApi;
  }

  set cadespluginApi(api) {
    CadespluginEsignApi._cadespluginApi = api;
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

  async getSignedDocument(thumbprint, base64) {
    return await this.cadespluginApi.signBase64(thumbprint, base64);
  }

  verifySigned = async (signedMessage, signedDocument) => {
    return await this.cadespluginApi.verifyBase64(signedMessage, signedDocument);
  };
}

export default new CadespluginEsignApi();
