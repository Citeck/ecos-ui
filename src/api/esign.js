import get from 'lodash/get';
import set from 'lodash/set';
import getCadespluginAPI from 'async-cadesplugin';

import { RecordService } from './recordService';
import Records from '../components/Records';

export class EsignApi extends RecordService {
  static _cadespluginApi = null;
  static _hasCadesplugin = false;

  get cadespluginApi() {
    return EsignApi._cadespluginApi;
  }

  set cadespluginApi(api) {
    EsignApi._cadespluginApi = api;
  }

  get hasCadesplugin() {
    return EsignApi._hasCadesplugin;
  }

  set hasCadesplugin(hasCadesplugin) {
    EsignApi._hasCadesplugin = hasCadesplugin;
  }

  getCadespluginApi = async () => {
    const api = get(window, 'cadesplugin.api', null);

    if (!api) {
      const api = await getCadespluginAPI();

      if (api === null) {
        EsignApi._hasCadesplugin = false;

        throw new Error();
      }

      EsignApi._hasCadesplugin = true;
      this.cadespluginApi = api;

      return api;
    }

    return api;
  };

  setCadespluginApi = api => {
    this.cadespluginApi = api;

    set(window, 'cadesplugin.api', api);
  };

  async getCertificates() {
    return await this.cadespluginApi.getValidCertificates();
  }

  getPluginVersion() {
    return this.cadespluginApi.about();
  }

  getDocumentData = record => {
    return fetch(`/share/proxy/alfresco/acm/digestAndAttr?nodeRef=${record}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };
}
