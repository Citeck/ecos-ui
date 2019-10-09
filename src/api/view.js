import { CommonApi } from './common';
import { MICRO_URI } from '../constants/alfresco';
import { DEFAULT_THEME } from '../constants/theme';

export class ViewApi extends CommonApi {
  getCurrentThemeName = siteId => {
    return this.getHtml(`${MICRO_URI}api/themes/current?siteId=${siteId || ''}`)
      .then(resp => resp)
      .catch(() => DEFAULT_THEME);
  };
}
