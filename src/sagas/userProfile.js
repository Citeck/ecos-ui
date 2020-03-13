import { call, put, takeEvery } from 'redux-saga/effects';
import { changePassword, changePhoto, getUserData, setChangePhoto, setUserData, setUserPhoto } from '../actions/user';
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
    logger.error('[userProfile/sagaChangePhoto saga] error', e.message);
  }
}

function* sagaChangePassword({ api, logger }, { payload }) {
  const { data, record, stateId } = payload;

  try {
    const response = yield call(api.user.changePassword, { record, data });

    yield put(setChangePhoto({ stateId }));

    if (!response) {
      yield put(setNotificationMessage(t('user-profile-widget.error.change-profile-password')));
    }
  } catch (e) {
    yield put(setNotificationMessage(t('user-profile-widget.error.change-profile-password')));
    logger.error('[userProfile/sagaChangePassword saga] error', e.message);
  }
}

function* userProfileSaga(ea) {
  yield takeEvery(getUserData().type, sagaGetUserData, ea);
  yield takeEvery(changePhoto().type, sagaChangePhoto, ea);
  yield takeEvery(changePassword().type, sagaChangePassword, ea);
}

export default userProfileSaga;
