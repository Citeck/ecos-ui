import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import {
  getFormProps,
  getModel,
  getTitle,
  initData,
  saveAndDeployModel,
  saveModel,
  setFormProps,
  setLoading,
  setModel,
  setTitle
} from '../actions/bpmnEditor';
import { deleteTab } from '../actions/pageTabs';
import { t } from '../helpers/export/util';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import * as CmmnUtils from '../components/ModelEditor/CMMNModeler/utils';
import PageTabList from '../services/pageTabs/PageTabList';

export function* init({ api, logger }, { payload: { stateId, record } }) {
  try {
    yield put(getTitle({ stateId, record }));
    yield put(getModel({ stateId, record }));
  } catch (e) {
    logger.error('[bpmnEditor/init saga] error', e.message);
  }
}

export function* fetchModel({ api, logger }, { payload: { stateId, record } }) {
  try {
    const model = yield call(api.cmmn.getDefinition, record);

    yield put(setModel({ stateId, model }));
  } catch (e) {
    yield put(setModel({ stateId, model: null }));
    logger.error('[bpmnEditor/fetchModel saga] error', e.message);
  }
}

export function* runSaveModel({ api, logger }, { payload: { stateId, record, xml, img } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.cmmn.saveDefinition, record, xml, base64);

      if (!res.id) {
        throw new Error();
      }

      // @todo add translation message
      NotificationManager.success(t('bpmn-editor.success.model-saved'), t('success'));
      yield put(deleteTab(PageTabList.activeTab));
    }
  } catch (e) {
    yield put(setLoading({ stateId, isLoading: false }));

    // @todo add translation message
    NotificationManager.error(e.message || t('error'), t('bpmn-editor.error.can-not-save-model'));
    logger.error('[bpmnEditor/runSaveModel saga] error', e.message);
  }
}

// @todo remove duplicate with runSaveModel
export function* runSaveDeployModel({ api, logger }, { payload: { stateId, record, xml, img } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.cmmn.saveDefinitionAndDeploy, record, xml, base64);

      if (!res.id) {
        throw new Error();
      }

      NotificationManager.success(t('bpmn-editor.success.model-save-deployed'), t('success'));
    }
  } catch (e) {
    yield put(setLoading({ stateId, isLoading: false }));

    NotificationManager.error(e.message || t('error'), t('bpmn-editor.error.can-not-save-deploy-model'));
    logger.error('[bpmnEditor/runSaveModel saga] error', e.message);
  }
}

export function* fetchTitle({ api, logger }, { payload: { stateId, record } }) {
  try {
    const title = yield call(api.page.getRecordTitle, record);

    yield put(setTitle({ stateId, title }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    logger.error('[bpmnEditor/fetchTitle saga] error', e.message);
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

    NotificationManager.error(t('model-editor.error.form-not-found'), t('error'));
    logger.error('[bpmnEditor/fetchFormProps saga] error', e.message);
  }
}

function* bpmnEditorSaga(ea) {
  yield takeEvery(initData().type, init, ea);
  yield takeEvery(getModel().type, fetchModel, ea);
  yield takeEvery(saveModel().type, runSaveModel, ea);
  yield takeEvery(saveAndDeployModel().type, runSaveDeployModel, ea);
  yield takeEvery(getTitle().type, fetchTitle, ea);
  yield takeEvery(getFormProps().type, fetchFormProps, ea);
}

export default bpmnEditorSaga;
