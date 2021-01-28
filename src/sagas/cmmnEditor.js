import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import {
  getFormProps,
  getScenario,
  getTitle,
  initData,
  saveScenario,
  setFormProps,
  setLoading,
  setScenario,
  setTitle
} from '../actions/cmmnEditor';
import { t } from '../helpers/export/util';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import { PREFIX_FIELD } from '../constants/cmmn';

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

export function* fetchFormProps({ api, logger }, { payload: { stateId, record, formId, element } }) {
  try {
    if (!formId) {
      return;
    }

    const form = yield call(EcosFormUtils.getFormById, formId, { formDefinition: 'definition?json', formI18n: 'i18n?json' });
    const inputs = EcosFormUtils.getFormInputs(form.formDefinition);
    const fields = inputs.map(inp => inp.attribute);
    const formData = {};

    if (element) {
      const businessObject = ModelUtil.getBusinessObject(element);

      fields.forEach(key => {
        if (key === 'name') {
          formData.name = ModelUtil.getName(element);
        } else {
          formData[key] = businessObject.get(PREFIX_FIELD + key);
        }
      });
    }

    yield put(setFormProps({ stateId, formProps: { ...form, formData } }));
  } catch (e) {
    yield put(setFormProps({ stateId, formProps: {} }));
    logger.error('[cmmnEditor/fetchFormProps saga] error', e.message);
  }
}

function* cmmnEditorSaga(ea) {
  yield takeEvery(initData().type, init, ea);
  yield takeEvery(getScenario().type, fetchScenario, ea);
  yield takeEvery(saveScenario().type, runSaveScenario, ea);
  yield takeEvery(getTitle().type, fetchTitle, ea);
  yield takeEvery(getFormProps().type, fetchFormProps, ea);
}

export default cmmnEditorSaga;
