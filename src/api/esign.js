import getCadespluginAPI from 'async-cadesplugin';
import get from 'lodash/get';
import set from 'lodash/set';
import { PROXY_URI } from '../constants/alfresco';
import ConfigService, { ALFRESCO_ENABLED } from '../services/config/ConfigService';
import Records from '../components/Records/Records';

class EsignApi {
  static _cadespluginApi = null;

  constructor() {
    /**
     * Disable standard notifications from the plugin
     */
    set(window, 'cadesplugin_skip_extension_install', true);
  }

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

  async getCertificates(thumbprints) {
    if (Array.isArray(thumbprints) && thumbprints.length > 0) {
      return await Promise.all(thumbprints.map(this.cadespluginApi.getCert));
    } else if (typeof thumbprints === 'string' || thumbprints instanceof String) {
      return [await this.cadespluginApi.getCert(thumbprints)];
    } else {
      return await this.cadespluginApi.getValidCertificates();
    }
  }

  getDocumentData = async record => {
    const hasAlfresco = await ConfigService.getValue(ALFRESCO_ENABLED);

    if (hasAlfresco) {
      return fetch(`${PROXY_URI}acm/digestAndAttr?nodeRef=${record}`, {
        method: 'GET',
        credentials: 'include'
      }).then(response => response.json());
    }

    return Records.query(
      {
        sourceId: 'edi/esign-digest-att-get',
        record
      },
      {
        success: 'success?bool',
        digestResult: 'digestResult?str',
        errorString: 'errorString?str'
      }
    );
  };

  async getSignedDocument(thumbprint, base64) {
    return await this.cadespluginApi.signBase64(thumbprint, base64);
  }

  verifySigned = async (signedMessage, signedDocument) => {
    return await this.cadespluginApi.verifyBase64(signedMessage, signedDocument);
  };

  sendSignedDocument = async (body = {}) => {
    const hasAlfresco = await ConfigService.getValue(ALFRESCO_ENABLED);

    if (hasAlfresco) {
      return fetch(`${PROXY_URI}acm/digitalSignaturePut`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body)
      }).then(response => response.json());
    }

    return Records.query(
      {
        sourceId: 'edi/esign-digital-signature-put',
        query: body
      },
      {
        success: 'success?bool',
        digestResult: 'digestResult?str',
        errorString: 'errorString?str'
      }
    );
  };
}

export default new EsignApi();
