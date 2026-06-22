import { SourcesId } from '@citeck/constants';
import { MICRO_URI } from '@citeck/constants/alfresco';
import {
  DEFAULT_THEME,
  THEME_URL_PATH,
  CACHE_KEY_RESOURCE_THEME,
  CACHE_KEY_RESOURCE_IMAGES,
  CACHE_KEY_RESOURCE_I18N,
  CACHE_KEY_RESOURCE_MENU
} from '@citeck/constants/theme';
import Records from '@citeck/records-core';

import ecosFetch from '../helpers/ecosFetch';
import ConfigService, { ACTIVE_THEME } from '../services/config/ConfigService';

import { CommonApi } from './common';

export class ViewApi extends CommonApi {
  getActiveThemeId = () => {
    return ecosFetch(`${THEME_URL_PATH}/current`)
      .then(resp => (resp.ok ? resp.text() : DEFAULT_THEME))
      .catch(() => DEFAULT_THEME);
  };

  getThemeCacheKeys = () => {
    const resources = [CACHE_KEY_RESOURCE_THEME, CACHE_KEY_RESOURCE_IMAGES, CACHE_KEY_RESOURCE_I18N, CACHE_KEY_RESOURCE_MENU];
    return ecosFetch(`${MICRO_URI}api/ui-cache?types=${resources.join(',')}`)
      .then(resp => (resp.ok ? resp.json() : {}))
      .catch(() => {});
  };

  changeTheme = theme => {
    return ConfigService.setValue(ACTIVE_THEME, theme);
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
