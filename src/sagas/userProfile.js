import { call, put, takeEvery } from 'redux-saga/effects';
import { getUserData, setUserData } from '../actions/user';

function* sagaGetUserData({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const data = yield call(api.user.getUserData, record);

    yield put(setUserData({ data, stateId }));
  } catch (e) {
    logger.error('[userProfile/sagaGetUserData saga] error', e.message);
  }
}

function* userProfileSaga(ea) {
  yield takeEvery(getUserData().type, sagaGetUserData, ea);
}

export default userProfileSaga;
