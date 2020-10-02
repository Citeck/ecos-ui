import { CommonApi } from './common';
import Records from '../components/Records';
import ecosFetch from '../helpers/ecosFetch';
import { DEFAULT_THEME, THEME_URL_PATH } from '../constants/theme';
import { SourcesId } from '../constants';

export class ViewApi extends CommonApi {
  getActiveThemeId = () => {
    return ecosFetch(`${THEME_URL_PATH}/current`)
      .then(resp => (resp.ok ? resp.text() : DEFAULT_THEME))
      .catch(() => DEFAULT_THEME);
  };

  getThemeCacheKey = () => {
    return Records.get(`${SourcesId.META}@`).load('attributes.theme-cache-key', true);
  };

  changeTheme = theme => {
    const record = Records.get(`${SourcesId.CONFIG}@active-theme`);

    record.att('value', theme);

    return record.save();
  };

  getThemeConfig = theme => {
    return Records.get(`${SourcesId.THEME}@${theme}`)
      .load(
        {
          name: 'name?str',
          images: 'images?json'
        },
        true
      )
      .catch(() => null);
  };
}
