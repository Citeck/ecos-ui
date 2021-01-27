import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { getFormData, getScenario, getTitle, initData, saveScenario, setLoading, setScenario, setTitle } from '../actions/cmmnEditor';
import { t } from '../helpers/export/util';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';

export function* init({ api, logger }, { payload: { stateId, record } }) {
  try {
    yield put(getTitle({ stateId, record }));
    yield put(getScenario({ stateId, record }));
  } catch (e) {
    logger.error('[cmmnEditor/init saga] error', e.message);
  }
}

export function* fetchScenario({ api, logger }, { payload: { stateId, record } }) {
  try {
    const scenario = yield call(api.cmmn.getDefinition, record);

    yield put(setScenario({ stateId, scenario }));
  } catch (e) {
    yield put(setScenario({ stateId, scenario: null }));
    logger.error('[cmmnEditor/fetchScenario saga] error', e.message);
  }
}

export function* runSaveScenario({ api, logger }, { payload: { stateId, record, xml, img } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.cmmn.saveDefinition, record, xml, base64);

      if (res && res.id) {
        yield put(setScenario({ stateId, scenario: xml }));
      }
    } else throw new Error();
  } catch (e) {
    yield put(setLoading({ stateId, isLoading: false }));
    NotificationManager.error(t('cmmn-editor.error.can-not-save-scenario'), t('error'));
    logger.error('[cmmnEditor/runSaveScenario  saga] error', e.message);
  }
}

export function* fetchTitle({ api, logger }, { payload: { stateId, record } }) {
  try {
    const title = yield call(api.page.getRecordTitle, record);

    yield put(setTitle({ stateId, title }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    logger.error('[cmmnEditor/fetchTitle saga] error', e.message);
  }
}

export function* fetchFormData({ api, logger }, { payload: { stateId, record, formId } }) {
  try {
    console.log(stateId, record, formId);
    const form = yield call(EcosFormUtils.getFormById, formId, { definition: 'definition?json', i18n: 'i18n?json' });
    console.log(form);
    const inputs = EcosFormUtils.getFormInputs(form.definition);
    const fields = inputs.map(inp => inp.attribute);
    console.log(fields);
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
  yield takeEvery(getFormData().type, fetchFormData, ea);
}

export default cmmnEditorSaga;
