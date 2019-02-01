import { put, takeLatest, call } from 'redux-saga/effects';

import { initAppRequest, initAppSuccess, initAppFailure } from '../actions/app';
import { validateUserSuccess, validateUserFailure } from '../actions/user';
import { setIsMobile } from '../actions/view';

import { isMobileDevice } from '../helpers/util';

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

    // --- Load translation messages ---
    // TODO load translation messages

    yield put(initAppSuccess());
  } catch (e) {
    logger.error('[initApp saga] error', e.message);
    yield put(initAppFailure());
  }
}

function* appSaga(ea) {
  yield takeLatest(initAppRequest().type, initApp, ea);
}

export default appSaga;
