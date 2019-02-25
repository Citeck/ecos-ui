import { put, takeLatest, call } from 'redux-saga/effects';
import { initAppRequest, initAppSuccess, initAppFailure, loadThemeRequest } from '../actions/app';
import { validateUserSuccess, validateUserFailure } from '../actions/user';
import { setIsMobile, setTheme } from '../actions/view';
import { isMobileDevice, applyTheme } from '../helpers/util';

export function* initApp({ api, fakeApi, logger }) {
  try {
    // --- Validate user ---
    const checkAuthResp = yield call(api.user.checkIsAuthenticated);
    if (checkAuthResp.success) {
      const resp = yield call(api.user.getUserData);
      if (!resp.success) {
        yield put(validateUserFailure());
      } else {
        yield put(validateUserSuccess(resp.payload));
      }
    }

    // --- Detect mobile device ---
    yield put(setIsMobile(isMobileDevice()));
    //
    // // --- Load theme ---
    // const themeName = yield call(fakeApi.getCurrentThemeName);
    // if (themeName) {
    //   yield put(setTheme(themeName));
    //   yield call(applyTheme, themeName);
    // }

    // --- Load translation messages ---
    // TODO load translation messages

    yield put(initAppSuccess());
  } catch (e) {
    logger.error('[initApp saga] error', e.message);
    yield put(initAppFailure());
  }
}

export function* loadTheme({ api, fakeApi, logger }, { payload }) {
  try {
    const themeName = yield call(fakeApi.getCurrentThemeName);
    yield put(setTheme(themeName));
    yield call(applyTheme, themeName);

    typeof payload.onSuccess === 'function' && payload.onSuccess(themeName);
  } catch (e) {
    logger.error('[loadTheme saga] error', e.message);
    yield put(initAppFailure());
  }
}

function* appSaga(ea) {
  yield takeLatest(initAppRequest().type, initApp, ea);
  yield takeLatest(loadThemeRequest().type, loadTheme, ea);
}

export default appSaga;
