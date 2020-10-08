import { createSelector } from 'reselect';
import get from 'lodash/get';

import { THEME_URL_PATH, CACHE_KEY_RESOURCE_IMAGES, CACHE_KEY_RESOURCE_THEME } from '../constants/theme';

const themeFileName = (state, name = 'main') => name;
const themeImage = (state, image = 'logo') => image;
export const selectThemeId = state => get(state, 'view.themeConfig.id');
export const selectThemeImages = state => get(state, 'view.themeConfig.images', {});
export const selectThemeCacheKeys = state => {
  return get(state, 'view.themeConfig.cacheKeys') || {};
};

export const selectThemeCacheKey = createSelector(
  [selectThemeCacheKeys],
  cacheKeys => cacheKeys[CACHE_KEY_RESOURCE_THEME]
);

export const selectThemeImagesCacheKey = createSelector(
  [selectThemeCacheKeys],
  cacheKeys => cacheKeys[CACHE_KEY_RESOURCE_IMAGES]
);

export const selectActiveThemeImage = createSelector(
  [selectThemeImagesCacheKey, themeImage],
  (cacheKey, image = 'logo') => `${THEME_URL_PATH}/active/image/${image}?cacheKey=${cacheKey}`
);

export const selectActiveThemeStylesheet = createSelector(
  [selectThemeCacheKey, themeFileName],
  (cacheKey, file) => `${THEME_URL_PATH}/active/style/${file}?cacheKey=${cacheKey}`
);
