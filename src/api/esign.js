import get from 'lodash/get';
import set from 'lodash/set';
import getCadespluginAPI from 'async-cadesplugin';

import { RecordService } from './recordService';
import Records from '../components/Records';

export class EsignApi extends RecordService {
  static _cadespluginApi = null;

  get cadespluginApi() {
    return EsignApi._cadespluginApi;
  }

  set cadespluginApi(api) {
    EsignApi._cadespluginApi = api;
  }

  getCadespluginApi = () => {
    const api = get(window, 'cadesplugin.api', null);

    if (!api) {
      return getCadespluginAPI();
    }

    return api;
  };

  setCadespluginApi = api => {
    this.cadespluginApi = api;

    set(window, 'cadesplugin.api', api);
  };

  getCertificates() {
    return this.cadespluginApi.getValidCertificates();
  }

  getDocumentData = record => {
    return fetch(`/share/proxy/alfresco/acm/digestAndAttr?nodeRef=${record}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };
}
