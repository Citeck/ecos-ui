import { CommonApi } from './common';
import { PROXY_URI, MICRO_URI } from '../constants/alfresco';
import { DEFAULT_THEME } from '../constants/theme';

export class AppApi extends CommonApi {
  getEcosConfig = configName => {
    const url = `${PROXY_URI}citeck/ecosConfig/ecos-config-value?configName=${configName}`;
    return this.getJson(url)
      .then(resp => resp.value)
      .catch(() => '');
  };

  getCurrentThemeName = siteId => {
    return this.getHtml(`${MICRO_URI}api/themes/current?siteId=${siteId || ''}`)
      .then(resp => resp)
      .catch(() => DEFAULT_THEME);
  };
}
