import get from 'lodash/get';
import { call, put, takeEvery } from 'redux-saga/effects';

import {
  addNewVersion,
  addNewVersionError,
  addNewVersionSuccess,
  getVersions,
  getVersionsComparison,
  getWritePermission,
  setActiveVersion,
  setActiveVersionError,
  setActiveVersionSuccess,
  setVersions,
  setVersionsComparison,
  setWritePermission
} from '../actions/versionsJournal';
import Records from '../components/Records';
import VersionsJournalConverter from '../dto/versionsJournal';
import { t } from '../helpers/util';

import { NotificationManager } from '@/services/notifications';

function* sagaGetVersions({ api }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.getVersions, payload.record);

    yield put(
      setVersions({
        id: payload.id,
        versions: result.records.map(VersionsJournalConverter.getVersionForWeb),
        ...VersionsJournalConverter.getAdditionParamsForWeb(result)
      })
    );
  } catch (e) {
    console.error('[versionJournal/sagaGetVersions saga] error', e);
  }
}

function* sagaAddNewVersion({ api }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.addNewVersion, {
      body: VersionsJournalConverter.getAddVersionFormDataForServer(payload),
      handleProgress: payload.handleProgress
    });

    if (result.status.code === 200) {
      yield put(addNewVersionSuccess(payload.id));
      Records.get(payload.record).update();
    } else {
      yield put(addNewVersionError({ message: result.message, id: payload.id }));
    }
  } catch (e) {
    console.error('[versionJournal/sagaAddNewVersion saga] error', e);
    NotificationManager.error(t('documents-widget.error.upload-filed'), t('error'));
    yield put(addNewVersionError({ message: e.message, id: payload.id }));
  }
}

function* sagaSetNewVersion({ api }, { payload }) {
  try {
    yield call(api.versionsJournal.setActiveVersion, VersionsJournalConverter.getActiveVersionForServer(payload));
    yield put(setActiveVersionSuccess(payload.id));
    yield put(getVersions({ record: payload.record, id: payload.id }));
    Records.get(payload.record).update();
  } catch (e) {
    console.error('[versionJournal/sagaSetNewVersion saga] error', e);
    yield put(setActiveVersionError({ message: e.message, id: payload.id }));
  }
}

function* sagaGetVersionsComparison({ api }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.getVersionsComparison, VersionsJournalConverter.getVersionsComparisonForServer(payload));
    const comparison = get(result, ['records', '0', 'diff'], '');

    yield put(setVersionsComparison({ record: payload.record, id: payload.id, comparison }));
  } catch (e) {
    console.error('[versionJournal/sagaGetVersionsComparison saga] error', e);
    NotificationManager.error(t('documents-widget.error.upload-version'), t('error'));
  }
}

function* sagaGetWritePermission({ api }, { payload }) {
  try {
    const hasWritePermission = yield call(api.versionsJournal.hasWritePermission, payload.record);

    yield put(setWritePermission({ record: payload.record, id: payload.id, hasWritePermission }));
  } catch (e) {
    console.error('[versionJournal/sagaGetWritePermission saga] error', e);
  }
}

function* saga(ea) {
  yield takeEvery(getVersions().type, sagaGetVersions, ea);
  yield takeEvery(addNewVersion().type, sagaAddNewVersion, ea);
  yield takeEvery(setActiveVersion().type, sagaSetNewVersion, ea);
  yield takeEvery(getVersionsComparison().type, sagaGetVersionsComparison, ea);
  yield takeEvery(getWritePermission().type, sagaGetWritePermission, ea);
}

export default saga;
