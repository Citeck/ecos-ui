import { call, put, takeLatest } from 'redux-saga/effects';
import set from 'lodash/set';
import get from 'lodash/get';

import { getUserData, setNewUIAvailableStatus, validateUserSuccess } from '../actions/user';

export function* initUser({ api, logger }, { payload }) {
  try {
    const resp = yield call(api.user.getUserData);

    if (resp.success) {
      yield put(validateUserSuccess(resp.payload));
      set(window, 'Alfresco.constants.USERNAME', get(resp.payload, 'userName'));

      const isNewUIAvailable = true;

      yield put(setNewUIAvailableStatus(isNewUIAvailable));
    }

    typeof payload.onSuccess === 'function' && payload.onSuccess();
  } catch (e) {
    logger.error('[user/getUserData saga] error', e.message);
  }
}

function* userSaga(ea) {
  yield takeLatest(getUserData().type, initUser, ea);
}

export default userSaga;
