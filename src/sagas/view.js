import get from 'lodash/get';
import { put, takeLatest, call, select } from 'redux-saga/effects';

import { detectMobileDevice, setTheme, setThemeConfig, setIsMobile, loadThemeRequest } from '../actions/view';
import { applyTheme, isMobileDevice, loadStylesheet } from '../helpers/util';
import { selectActiveThemeStylesheet } from '../selectors/view';

export function* doDetectMobileDevice() {
  try {
    yield put(setIsMobile(isMobileDevice()));
  } catch (e) {
    console.error('[doDetectMobileDevice saga] error', e);
  }
}

export function* loadTheme({ api }, { payload }) {
  try {
    const { isAuthenticated, onRender } = payload;
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

    yield call(loadStylesheet, stylesheetUrl, onRender, onRender);
  } catch (e) {
    console.error('[loadTheme saga] error', e);
  }
}

function* appSaga(ea) {
  yield takeLatest(detectMobileDevice().type, doDetectMobileDevice, ea);
  yield takeLatest(loadThemeRequest().type, loadTheme, ea);
}

export default appSaga;
