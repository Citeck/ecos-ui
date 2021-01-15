import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { getScenario, getTitle, initData, saveRecordData, saveScenario, setScenario, setTitle } from '../actions/cmmnEditor';
import { t } from '../helpers/export/util';
import { CmmnUtils } from '../components/CMMNDesigner/index';

function* init({ api, logger }, { payload: { stateId, record } }) {
  try {
    yield put(getTitle({ stateId, record }));
    yield put(getScenario({ stateId, record }));
  } catch (e) {
    logger.error('[cmmnEditor/init saga] error', e.message);
  }
}

function* fetchScenario({ api, logger }, { payload: { stateId, record } }) {
  try {
    const scenario = yield call(api.cmmn.getDefinition, record);

    yield put(setScenario({ stateId, scenario: CmmnUtils.initialDiagram }));
  } catch (e) {
    yield put(setScenario({ stateId, scenario: null }));
    logger.error('[cmmnEditor/fetchScenario saga] error', e.message);
  }
}

function* runSaveScenario({ api, logger }, { payload: { stateId, record, xml, img } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.cmmn.saveDefinition, record, xml, base64);

      if (res.id) {
        yield put(setScenario({ stateId, scenario: xml }));
      }
    } else throw new Error();
  } catch (e) {
    NotificationManager.error(t('cmmn-editor.error.can-not-save-scenario'), t('error'));
    logger.error('[cmmnEditor/runSaveScenario  saga] error', e.message);
  }
}

function* runSaveRecord({ api, logger }, { payload: { record, data } }) {
  try {
    yield call(api.cmmn.saveRecordData, record, data);
  } catch (e) {
    NotificationManager.error(t('cmmn-editor.error.can-not-save-record-data'), t('error'));
    logger.error('[cmmnEditor/runSaveRecord saga] error', e.message);
  }
}

function* fetchTitle({ api, logger }, { payload: { stateId, record } }) {
  try {
    const title = yield call(api.page.getRecordTitle, record);

    yield put(setTitle({ stateId, title }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    logger.error('[cmmnEditor/fetchTitle saga] error', e.message);
  }
}

function* cmmnEditorSaga(ea) {
  yield takeEvery(initData().type, init, ea);
  yield takeEvery(getScenario().type, fetchScenario, ea);
  yield takeEvery(saveScenario().type, runSaveScenario, ea);
  yield takeEvery(getTitle().type, fetchTitle, ea);
  yield takeEvery(saveRecordData().type, runSaveRecord, ea);
}

export default cmmnEditorSaga;
