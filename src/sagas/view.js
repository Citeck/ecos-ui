import { put, takeLatest, call, select } from 'redux-saga/effects';
import get from 'lodash/get';

import { detectMobileDevice, setTheme, setThemeConfig } from '../actions/view';
import { setIsMobile, loadThemeRequest } from '../actions/view';
import { applyTheme, isMobileDevice, loadStylesheet } from '../helpers/util';
import { selectActiveThemeStylesheet } from '../selectors/view';

export function* doDetectMobileDevice({ logger }) {
  try {
    yield put(setIsMobile(isMobileDevice()));
  } catch (e) {
    logger.error('[doDetectMobileDevice saga] error', e.message);
  }
}

export function* loadTheme({ api, logger }, { payload }) {
  try {
    const { isAuthenticated, onSuccess } = payload;
    const id = yield call(api.view.getActiveThemeId);
    const cacheKeys = yield call(api.view.getThemeCacheKeys);
    const themeConfig = { id, cacheKeys };

    if (isAuthenticated) {
      const config = yield call(api.view.getThemeConfig, id);
      themeConfig.images = get(config, 'images', {});
      themeConfig.name = get(config, 'name', '');
    }

    yield put(setThemeConfig(themeConfig));

    yield put(setTheme(id));
    yield call(applyTheme, id);

    const stylesheetUrl = yield select(selectActiveThemeStylesheet);
    yield call(loadStylesheet, stylesheetUrl, onSuccess, onSuccess);
  } catch (e) {
    logger.error('[loadTheme saga] error', e.message);
  }
}

function* appSaga(ea) {
  yield takeLatest(detectMobileDevice().type, doDetectMobileDevice, ea);
  yield takeLatest(loadThemeRequest().type, loadTheme, ea);
}

export default appSaga;
