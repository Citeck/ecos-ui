import { createSelector } from 'reselect';
import get from 'lodash/get';

import { THEME_URL_PATH } from '../constants/theme';

const themeFileName = (state, name = 'main') => name;
const themeImage = (state, image = 'logo') => image;
export const selectThemeId = state => get(state, 'view.themeConfig.id');
export const selectThemeImages = state => get(state, 'view.themeConfig.images', {});
export const selectThemeCacheKey = state => {
  const stateCacheKey = get(state, 'view.themeConfig.cacheKey');
  if (stateCacheKey) {
    return stateCacheKey;
  }
  return new Date().getTime();
};

export const selectImagesByTheme = createSelector(
  [selectThemeId, selectThemeImages, selectThemeCacheKey],
  (theme, images, cacheKey) => {
    return Object.keys(images).reduce(
      (result, key) => ({
        ...result,
        [key]: `${THEME_URL_PATH}/${theme}/image/${key}?cacheKey=${cacheKey}`
      }),
      {}
    );
  }
);

export const selectThemeImage = createSelector(
  [selectThemeId, selectThemeCacheKey, themeImage],
  (theme, key, image = 'logo') => `${THEME_URL_PATH}/${theme}/image/${image}?cacheKey=${key}`
);

export const selectThemeStylesheet = createSelector(
  [selectThemeId, selectThemeCacheKey, themeFileName],
  (theme, key, file) => `${THEME_URL_PATH}/${theme}/style/${file}?cacheKey=${key}`
);

export const selectActiveThemeImage = createSelector(
  [selectThemeCacheKey, themeImage],
  (key, image = 'logo') => `${THEME_URL_PATH}/active/image/${image}?cacheKey=${key}`
);

export const selectActiveThemeStylesheet = createSelector(
  [selectThemeCacheKey, themeFileName],
  (key, file) => `${THEME_URL_PATH}/active/style/${file}?cacheKey=${key}`
);
