import { put, takeLatest, call, select } from 'redux-saga/effects';
import get from 'lodash/get';

import { detectMobileDevice, setTheme, setThemeConfig } from '../actions/view';
import { setIsMobile, loadThemeRequest } from '../actions/view';
import { applyTheme, isMobileDevice, loadStylesheet } from '../helpers/util';
import { selectThemeStylesheet } from '../selectors/view';

export function* doDetectMobileDevice({ api, fakeApi, logger }) {
  try {
    yield put(setIsMobile(isMobileDevice()));
  } catch (e) {
    logger.error('[doDetectMobileDevice saga] error', e.message);
  }
}

export function* loadTheme({ api, fakeApi, logger }, { payload }) {
  try {
    const id = yield call(api.view.getActiveThemeId);
    const cacheKey = yield call(api.view.getThemeCacheKey);
    const themeConfig = yield call(api.view.getThemeConfig, id);
    const images = get(themeConfig, 'images', {});
    const name = get(themeConfig, 'name', '');

    yield put(
      setThemeConfig({
        id,
        name,
        images,
        cacheKey
      })
    );

    yield put(setTheme(id));
    yield call(applyTheme, id);

    const stylesheetUrl = yield select(selectThemeStylesheet);
    yield call(loadStylesheet, stylesheetUrl, payload.onSuccess, payload.onSuccess);
  } catch (e) {
    logger.error('[loadTheme saga] error', e.message);
  }
}

function* appSaga(ea) {
  yield takeLatest(detectMobileDevice().type, doDetectMobileDevice, ea);
  yield takeLatest(loadThemeRequest().type, loadTheme, ea);
}

export default appSaga;
