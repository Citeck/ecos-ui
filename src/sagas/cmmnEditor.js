import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { getDiagram, getTitle, initData, saveDiagram, setDiagram, setTitle } from '../actions/cmmnEditor';
import { initialDiagram } from '../components/CMMNDesigner/utils';
import { t } from '../helpers/export/util';

function* init({ api, logger }, { payload: { stateId, record } }) {
  try {
    yield put(getTitle({ stateId, record }));
    yield put(getDiagram({ stateId, record }));
  } catch (e) {
    logger.error('[cmmnEditor/init saga] error', e.message);
  }
}

function* fetchDiagram({ api, logger }, { payload: { stateId, record } }) {
  try {
    const diagram = yield call(api.cmmn.getDefinition, record);

    yield put(setDiagram({ stateId, diagram: initialDiagram }));
  } catch (e) {
    yield put(setDiagram({ stateId, diagram: null }));
    logger.error('[cmmnEditor/fetchDiagram saga] error', e.message);
  }
}

function* runSaveDiagram({ api, logger }, { payload: { stateId, record, xml, img } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.cmmn.saveDefinition, record, xml, base64);

      if (res.id) {
        yield put(setDiagram({ stateId, diagram: xml }));
      }
    } else throw new Error();
  } catch (e) {
    NotificationManager.error(t('cmmn-editor.error.can-not-save-diagram'), t('error'));
    logger.error('[cmmnEditor/runSaveDiagram saga] error', e.message);
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
  yield takeEvery(getDiagram().type, fetchDiagram, ea);
  yield takeEvery(saveDiagram().type, runSaveDiagram, ea);
  yield takeEvery(getTitle().type, fetchTitle, ea);
}

export default cmmnEditorSaga;
