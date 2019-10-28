import { put, takeLatest, call } from 'redux-saga/effects';
import { detectMobileDevice, setTheme } from '../actions/view';
import { setIsMobile, loadThemeRequest } from '../actions/view';
import { applyTheme, isMobileDevice } from '../helpers/util';

export function* doDetectMobileDevice({ api, fakeApi, logger }) {
  try {
    yield put(setIsMobile(isMobileDevice()));
  } catch (e) {
    logger.error('[doDetectMobileDevice saga] error', e.message);
  }
}

export function* loadTheme({ api, fakeApi, logger }, { payload }) {
  try {
    const themeName = yield call(api.view.getCurrentThemeName);
    yield put(setTheme(themeName));
    yield call(applyTheme, themeName);

    typeof payload.onSuccess === 'function' && payload.onSuccess(themeName);
  } catch (e) {
    logger.error('[loadTheme saga] error', e.message);
  }
}

function* appSaga(ea) {
  yield takeLatest(detectMobileDevice().type, doDetectMobileDevice, ea);
  yield takeLatest(loadThemeRequest().type, loadTheme, ea);
}

export default appSaga;
