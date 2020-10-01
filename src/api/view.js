import { CommonApi } from './common';
import Records from '../components/Records';
import { DEFAULT_THEME } from '../constants/theme';

export class ViewApi extends CommonApi {
  getActiveThemeId = () => {
    return Records.get('uiserv/config@active-theme')
      .load('value', true)
      .then(resp => {
        if (!resp) {
          return DEFAULT_THEME;
        }
        return resp;
      })
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
