import { call, put, takeEvery } from 'redux-saga/effects';
import { getUserData, setUserData } from '../actions/user';
import { setNotificationMessage } from '../actions/notification';
import { createThumbnailUrl } from '../helpers/urls';

function* sagaGetUserData({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const data = yield call(api.user.getUserDataByRef, record);

    yield put(
      setUserData({
        data: {
          ...data,
          thumbnail: createThumbnailUrl(record)
        },
        stateId
      })
    );
  } catch (e) {
    yield put(setNotificationMessage('Error Get User Data'));
    logger.error('[userProfile/sagaGetUserData saga] error', e.message);
  }
}

function* userProfileSaga(ea) {
  yield takeEvery(getUserData().type, sagaGetUserData, ea);
}

export default userProfileSaga;
