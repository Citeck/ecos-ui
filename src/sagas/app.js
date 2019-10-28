import { put, takeLatest, call } from 'redux-saga/effects';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';
import { initAppRequest, initAppSuccess, initAppFailure } from '../actions/app';
import { validateUserSuccess, validateUserFailure } from '../actions/user';
import { detectMobileDevice } from '../actions/view';

export function* initApp({ api, fakeApi, logger }, { payload }) {
  try {
    // --- Validate user ---
    const checkAuthResp = yield call(api.user.checkIsAuthenticated);
    if (checkAuthResp.success) {
      const resp = yield call(api.user.getUserData);
      if (!resp.success) {
        yield put(validateUserFailure());
      } else {
        yield put(validateUserSuccess(resp.payload));

        // TODO remove in future: see src/helpers/util.js getCurrentUserName()
        lodashSet(window, 'Alfresco.constants.USERNAME', lodashGet(resp.payload, 'userName'));
      }
    }

    yield put(detectMobileDevice());

    // --- Load translation messages ---
    // TODO load translation messages

    yield put(initAppSuccess());

    if (payload && payload.onSuccess) {
      typeof payload.onSuccess === 'function' && payload.onSuccess();
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
