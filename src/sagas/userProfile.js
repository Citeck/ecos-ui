import { call, put, takeEvery } from 'redux-saga/effects';
import { changePhoto, getUserData, setUserData, setUserPhoto } from '../actions/user';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import { createThumbnailUrl } from '../helpers/urls';

function* sagaGetUserData({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const data = yield call(api.user.getUserDataByRef, record);

    yield put(setUserData({ data, stateId }));
    yield put(setUserPhoto({ thumbnail: createThumbnailUrl(data.nodeRef), stateId }));
  } catch (e) {
    yield put(setNotificationMessage(t('user-profile-widget.error.get-profile-data')));
    logger.error('[userProfile/sagaGetUserData saga] error', e.message);
  }
}

function* sagaChangePhoto({ api, logger }, { payload }) {
  const { data, record, stateId } = payload;

  try {
    const response = yield call(api.user.changePhoto, { record, data });

    if (response) {
      yield put(setUserPhoto({ thumbnail: null, stateId }));
      yield put(setUserPhoto({ thumbnail: createThumbnailUrl(record), stateId }));
    } else {
      yield put(setNotificationMessage(t('user-profile-widget.error.upload-profile-photo')));
    }
  } catch (e) {
    yield put(setNotificationMessage(t('user-profile-widget.error.upload-profile-photo')));
    logger.error('[userProfile/sagaGetUserData saga] error', e.message);
  }
}

function* userProfileSaga(ea) {
  yield takeEvery(getUserData().type, sagaGetUserData, ea);
  yield takeEvery(changePhoto().type, sagaChangePhoto, ea);
}

export default userProfileSaga;
