import { call, put, takeEvery } from 'redux-saga/effects';
import { changePassword, changePhoto, getUserData, setChangePassword, setMessage, setUserData, setUserPhoto } from '../actions/user';
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
  const { data: file, record, stateId } = payload;

  try {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('name', file.name);

    const { nodeRef = null } = yield call(api.app.uploadFile, formData);

    if (!nodeRef) {
      throw new Error('No file nodeRef');
    }

    const response = yield call(api.user.changePhoto, {
      record,
      data: {
        size: file.size,
        name: file.name,
        data: { nodeRef }
      }
    });

    if (response.success) {
      const data = yield call(api.user.getUserDataByRef, record);

      yield put(setUserPhoto({ thumbnail: createThumbnailUrl(data.nodeRef, { t: Date.now() }), stateId }));
    } else {
      yield put(
        setMessage({ message: { text: t('user-profile-widget.error.upload-profile-photo'), error: true }, stateId, isLoadingPhoto: false })
      );
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
    const text = response.success
      ? t('user-profile-widget.success.change-profile-password')
      : `${t('user-profile-widget.error.change-profile-password')}. ${response.message}`;

    yield put(setChangePassword({ stateId }));
    yield put(setMessage({ message: { text, error: !response.success }, stateId, isLoadingPassword: false }));
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
