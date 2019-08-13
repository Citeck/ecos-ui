import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import {
  addNewVersion,
  addNewVersionSuccess,
  addNewVersionError,
  getVersions,
  setVersions,
  setActiveVersion,
  setActiveVersionSuccess,
  setActiveVersionError
} from '../actions/versionsJournal';
import VersionsJournalConverter from '../dto/versionsJournal';

function* sagaGetVersions({ api, logger }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.getVersions, payload);

    yield put(
      setVersions({
        versions: result.records.map(VersionsJournalConverter.getVersionForWeb),
        ...VersionsJournalConverter.getAdditionParamsForWeb(result)
      })
    );
  } catch (e) {
    logger.error('[versionJournal/sagaGetVersions saga] error', e.message);
  }
}

function* sagaAddNewVersion({ api, logger }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.addNewVersion, VersionsJournalConverter.getAddVersionFormDataForServer(payload));

    if (result.status.code === 200) {
      yield put(addNewVersionSuccess(result));
      yield put(getVersions(result.nodeRef));
    } else {
      yield put(addNewVersionError(result.message));
    }
  } catch (e) {
    logger.error('[versionJournal/sagaAddNewVersion saga] error', e.message);
    yield put(addNewVersionError(e.message));
  }
}

function* sagaSetNewVersion({ api, logger }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.setActiveVersion, VersionsJournalConverter.getActiveVersionForServer(payload));

    yield put(setActiveVersionSuccess(result));
    yield put(getVersions(result.id));
  } catch (e) {
    logger.error('[versionJournal/sagaSetNewVersion saga] error', e.message);
    yield put(setActiveVersionError(e.message));
  }
}

function* saga(ea) {
  yield takeEvery(getVersions().type, sagaGetVersions, ea);
  yield takeEvery(addNewVersion().type, sagaAddNewVersion, ea);
  yield takeEvery(setActiveVersion().type, sagaSetNewVersion, ea);
}

export default saga;
