import { CommonApi } from './common';
import Records from '../components/Records';
import { MICRO_URI } from '../constants/alfresco';
import { DEFAULT_THEME } from '../constants/theme';

export class ViewApi extends CommonApi {
  getCurrentThemeName = siteId => {
    return this.getHtml(`${MICRO_URI}api/themes/current?siteId=${siteId || ''}`)
      .then(resp => resp)
      .catch(() => DEFAULT_THEME);
  };

  getActiveThemeId = () => {
    return Records.get('uiserv/config@active-theme')
      .load('value', true)
      .then(resp => resp)
      .catch(() => DEFAULT_THEME);
  };

  getThemeCacheKey = () => {
    return Records.get('uiserv/meta@').load('attributes.theme-cache-key', true);
  };

  changeTheme = theme => {
    const record = Records.get('uiserv/config@active-theme');

    record.att('value', theme);

    return record.save();
  };

  getThemeConfig = theme => {
    return Records.get(`uiserv/theme@${theme}`)
      .load(
        {
          name: 'name?str',
          images: 'images?json'
        },
        true
      )
      .then(resp => resp)
      .catch(() => null);
  };
}
