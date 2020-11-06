import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { changePhoto, getUserData, setUserData, setUserPhoto } from '../actions/user';
import { setNotificationMessage } from '../actions/notification';
import { createThumbnailUrl } from '../helpers/urls';
import { t } from '../helpers/util';

function* sagaGetUserData({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const data = yield call(api.user.getUserDataByRef, record);

    yield put(setUserData({ data, stateId }));
    yield put(setUserPhoto({ thumbnail: createThumbnailUrl(data.nodeRef, { t: data.modified }), stateId }));
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
    let message = '';

    if (response.success) {
      const data = yield call(api.user.getUserDataByRef, record);

      yield put(setUserPhoto({ thumbnail: createThumbnailUrl(data.nodeRef, { t: data.modified || Date.now() }), stateId }));
      message = t('user-profile-widget.success.change-photo');
    } else {
      message = t('user-profile-widget.error.upload-profile-photo');
    }

    NotificationManager[response.success ? 'success' : 'error'](message);
  } catch (e) {
    yield put(setNotificationMessage(t('user-profile-widget.error.upload-profile-photo')));
    logger.error('[userProfile/sagaChangePhoto saga] error', e.message);
  } finally {
    yield put(setUserData({ stateId, isLoadingPhoto: false }));
  }
}

function* userProfileSaga(ea) {
  yield takeEvery(getUserData().type, sagaGetUserData, ea);
  yield takeEvery(changePhoto().type, sagaChangePhoto, ea);
}

export default userProfileSaga;
