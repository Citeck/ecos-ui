import { call, put, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  addNewVersion,
  addNewVersionSuccess,
  addNewVersionError,
  getVersions,
  setVersions,
  setActiveVersion,
  setActiveVersionSuccess,
  setActiveVersionError,
  getVersionsComparison,
  setVersionsComparison
} from '../actions/versionsJournal';
import VersionsJournalConverter from '../dto/versionsJournal';

function* sagaGetVersions({ api, logger }, { payload }) {
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
    logger.error('[versionJournal/sagaGetVersions saga] error', e.message);
  }
}

function* sagaAddNewVersion({ api, logger }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.addNewVersion, VersionsJournalConverter.getAddVersionFormDataForServer(payload));

    if (result.status.code === 200) {
      yield put(addNewVersionSuccess(payload.id));
      yield put(getVersions({ record: result.nodeRef, id: payload.id }));
    } else {
      yield put(addNewVersionError({ message: result.message, id: payload.id }));
    }
  } catch (e) {
    logger.error('[versionJournal/sagaAddNewVersion saga] error', e.message);
    yield put(addNewVersionError({ message: e.message, id: payload.id }));
  }
}

function* sagaSetNewVersion({ api, logger }, { payload }) {
  try {
    yield call(api.versionsJournal.setActiveVersion, VersionsJournalConverter.getActiveVersionForServer(payload));
    yield put(setActiveVersionSuccess(payload.id));
    yield put(getVersions({ record: payload.record, id: payload.id }));
  } catch (e) {
    logger.error('[versionJournal/sagaSetNewVersion saga] error', e.message);
    yield put(setActiveVersionError({ message: e.message, id: payload.id }));
  }
}

function* sagaGetVersionsComparison({ api, logger }, { payload }) {
  try {
    const result = yield call(api.versionsJournal.getVersionsComparison, VersionsJournalConverter.getVersionsComparisonForServer(payload));
    const comparison = get(result, ['records', '0', 'diff'], '');

    if (comparison) {
      yield put(setVersionsComparison({ record: payload.record, id: payload.id, comparison }));
    }
  } catch (e) {
    logger.error('[versionJournal/sagaGetVersionsComparison saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getVersions().type, sagaGetVersions, ea);
  yield takeEvery(addNewVersion().type, sagaAddNewVersion, ea);
  yield takeEvery(setActiveVersion().type, sagaSetNewVersion, ea);
  yield takeEvery(getVersionsComparison().type, sagaGetVersionsComparison, ea);
}

export default saga;
