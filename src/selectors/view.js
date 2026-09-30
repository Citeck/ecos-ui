import { THEME_URL_PATH, CACHE_KEY_RESOURCE_IMAGES, CACHE_KEY_RESOURCE_THEME } from '@citeck/constants/theme';
import get from 'lodash/get';

import { PageSizeMode } from '@/components/journals/Journals/constants';
import { createSelector } from 'reselect';

const themeFileName = (state, name = 'main') => name;
const themeImage = (state, image = 'logo') => image;
export const selectThemeId = state => get(state, 'view.themeConfig.id');
export const selectThemeImages = state => get(state, 'view.themeConfig.images', {});
export const selectThemeCacheKeys = state => {
  return get(state, 'view.themeConfig.cacheKeys') || {};
};

export const selectThemeCacheKey = createSelector([selectThemeCacheKeys], cacheKeys => cacheKeys[CACHE_KEY_RESOURCE_THEME]);

export const selectThemeImagesCacheKey = createSelector([selectThemeCacheKeys], cacheKeys => cacheKeys[CACHE_KEY_RESOURCE_IMAGES]);

export const selectActiveThemeImage = createSelector(
  [selectThemeCacheKey, themeImage],
  (cacheKey, image = 'logo') => `${THEME_URL_PATH}/active/image/${image}?cacheKey=${cacheKey}`
);

export const selectActiveThemeStylesheet = createSelector(
  [selectThemeCacheKey, themeFileName],
  (cacheKey, file) => `${THEME_URL_PATH}/active/style/${file}?cacheKey=${cacheKey}`
);

export const selectIsMobile = state => get(state, 'view.isMobile');

/**
 * Rows per page on the journals page when the global config `journals-pagination` fixes it,
 * otherwise null: the page fits as many rows as the window height allows (COREDEV-583).
 */
export const selectJournalsPageFixedPageSize = state => {
  const { pageSizeMode, pageSize } = get(state, 'view.journalsPagination.journalsPage') || {};
  const count = Number(pageSize);

  return pageSizeMode === PageSizeMode.FIXED && Number.isInteger(count) && count > 0 ? count : null;
};
