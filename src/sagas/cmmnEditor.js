import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

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
import { deleteTab } from '../actions/pageTabs';
import { t } from '../helpers/export/util';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import * as CmmnUtils from '../components/CMMNDesigner/utils';
import PageTabList from '../services/pageTabs/PageTabList';

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

      if (!res.id) {
        throw new Error();
      }

      NotificationManager.success(t('cmmn-editor.success.scenario-saved'), t('success'));
      yield put(deleteTab(PageTabList.activeTab));
    }
  } catch (e) {
    yield put(setLoading({ stateId, isLoading: false }));
    NotificationManager.error(e.message || t('error'), t('cmmn-editor.error.can-not-save-scenario'));
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

export function* fetchFormProps({ api, logger }, { payload: { stateId, formId, element } }) {
  try {
    if (!formId) {
      throw new Error('No form ID ' + formId);
    }

    const form = yield call(EcosFormUtils.getFormById, formId, { formDefinition: 'definition?json', formI18n: 'i18n?json' });

    if (!form.formDefinition) {
      throw new Error('Form is not found for ID ' + formId);
    }

    const inputs = EcosFormUtils.getFormInputs(form.formDefinition);
    const formData = {};

    if (element) {
      inputs.forEach(input => {
        const att = input.attribute;
        let value = CmmnUtils.getValue(element, att);
        const inputType = input.component && input.component.type;
        const isMultiple = input.component && input.component.multiple;
        if (
          value != null &&
          value !== '' &&
          (isMultiple === true || inputType === 'mlText' || inputType === 'datamap' || inputType === 'container')
        ) {
          value = JSON.parse(value);
        }
        formData[att] = value;
      });
    }

    yield put(setFormProps({ stateId, formProps: { ...form, formData } }));
  } catch (e) {
    yield put(setFormProps({ stateId, formProps: {} }));
    NotificationManager.error(t('cmmn-editor.error.form-not-found'), t('success'));
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
