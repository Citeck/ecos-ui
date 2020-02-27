import { put, takeLatest, call } from 'redux-saga/effects';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';
import { initAppRequest, initAppSuccess, initAppFailure } from '../actions/app';
import { validateUserSuccess, validateUserFailure } from '../actions/user';
import { detectMobileDevice } from '../actions/view';

export function* initApp({ api, fakeApi, logger }, { payload }) {
  try {
    // --- Validate user ---
    let isAuthenticated = false;
    try {
      const checkAuthResp = yield call(api.user.checkIsAuthenticated);
      if (!checkAuthResp.success) {
        yield put(validateUserFailure());
      } else {
        const resp = yield call(api.user.getUserData);
        if (!resp.success) {
          yield put(validateUserFailure());
        } else {
          isAuthenticated = true;
          yield put(validateUserSuccess(resp.payload));

          // TODO remove in future: see src/helpers/util.js getCurrentUserName()
          lodashSet(window, 'Alfresco.constants.USERNAME', lodashGet(resp.payload, 'userName'));
        }
      }
    } catch (e) {
      yield put(validateUserFailure());
    }

    yield put(detectMobileDevice());
    yield put(initAppSuccess());

    if (payload && payload.onSuccess) {
      typeof payload.onSuccess === 'function' && payload.onSuccess(isAuthenticated);
    }
  } catch (e) {
    logger.error('[initApp saga] error', e.message);
    yield put(initAppFailure());
  }
}

function* appSaga(ea) {
  yield takeLatest(initAppRequest().type, initApp, ea);
}

export default appSaga;
