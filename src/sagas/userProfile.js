import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { NotificationManager } from '@/services/notifications';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
  changePhoto,
  getAppUserThumbnail,
  getUserData,
  setAppUserThumbnail,
  setUserData,
  setUserPhoto,
  updAppUserData,
  validateUserSuccess,
} from '../actions/user';
import { setNotificationMessage } from '../actions/notification';
import { isNodeRef, t } from '../helpers/util';
import UserService from '../services/UserService';

function* sagaGetUserData({ api }, { payload }) {
  const { record, stateId } = payload;

  try {
    const data = yield call(api.user.getUserDataByRef, record);

    if (isEmpty(data)) {
      return;
    }

    yield put(setUserData({ data, stateId }));
    yield put(setUserPhoto({ thumbnail: data.thumbnail, stateId }));
  } catch (e) {
    yield put(setNotificationMessage(t('user-profile-widget.error.get-profile-data')));
    console.error('[userProfile/sagaGetUserData saga] error', e);
  }
}

function* sagaChangePhoto({ api }, { payload }) {
  const { data: file, record, stateId } = payload;

  try {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('name', file.name);

    let fileUploadFunc;

    if (isNodeRef(record)) {
      fileUploadFunc = api.app.uploadFile;
    } else {
      fileUploadFunc = api.app.uploadFileV2;
    }
    const { entityRef = null } = yield call(fileUploadFunc, formData);

    if (!entityRef) {
      throw new Error('No file entityRef');
    }

    const response = yield call(api.user.changePhoto, {
      record,
      data: {
        size: file.size,
        name: file.name,
        data: { entityRef },
      },
    });
    let message = '';

    if (response.success) {
      const data = yield call(api.user.getUserDataByRef, record, true);

      yield put(setUserPhoto({ thumbnail: UserService.getAvatarUrl(data.thumbnail), stateId }));
      message = t('user-profile-widget.success.change-photo');
    } else {
      message = t('user-profile-widget.error.upload-profile-photo');
    }

    NotificationManager[response.success ? 'success' : 'error'](message);
  } catch (e) {
    yield put(setNotificationMessage(t('user-profile-widget.error.upload-profile-photo')));
    console.error('[userProfile/sagaChangePhoto saga] error', e);
  } finally {
    yield put(setUserData({ stateId, isLoadingPhoto: false }));
  }
}

function* fetchAppUserData({ api }) {
  try {
    const resp = yield call(api.user.getUserData);

    yield put(validateUserSuccess(resp.payload));
    yield put(getAppUserThumbnail());
    set(window, 'Citeck.constants.USERNAME', get(resp.payload, 'userName'));
  } catch (e) {
    console.error('[user/getUpdUserData saga] error', e);
  }
}

function* fetchAppUserThumbnail({ api }) {
  try {
    const userData = yield select((state) => state.user);
    let { thumbnail } = userData || {};

    if (!thumbnail) {
      thumbnail = yield call(api.user.getUserPhoto);
    }

    if (thumbnail) {
      yield put(setAppUserThumbnail(thumbnail));
    }
  } catch (e) {
    console.error('[user/getUpdUserData saga] error', e);
  }
}

function* userProfileSaga(ea) {
  yield takeEvery(getUserData().type, sagaGetUserData, ea);
  yield takeEvery(changePhoto().type, sagaChangePhoto, ea);
  yield takeLatest(updAppUserData().type, fetchAppUserData, ea);
  yield takeLatest(getAppUserThumbnail().type, fetchAppUserThumbnail, ea);
}

export default userProfileSaga;
