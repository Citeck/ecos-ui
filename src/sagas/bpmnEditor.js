import { call, put, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import isUndefined from 'lodash/isUndefined';
import get from 'lodash/get';

import { getFormProps, getModel, getTitle, initData, saveModel, setFormProps, setLoading, setModel, setTitle } from '../actions/bpmnEditor';
import { deleteTab } from '../actions/pageTabs';
import { t } from '../helpers/export/util';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import * as BpmnUtils from '../components/ModelEditor/BPMNModeler/utils';
import PageTabList from '../services/pageTabs/PageTabList';
import { isJsonObjectString } from '../helpers/util';
import { JSON_VALUE_COMPONENTS } from '../constants/cmmn';

export function* init({ api, logger }, { payload: { stateId, record } }) {
  try {
    yield put(getTitle({ stateId, record }));
    yield put(getModel({ stateId, record }));
  } catch (e) {
    logger.error('[bpmnEditor/init saga] error', e);
  }
}

export function* fetchModel({ api, logger }, { payload: { stateId, record } }) {
  try {
    const model = yield call(api.cmmn.getDefinition, record);

    yield put(setModel({ stateId, model }));
  } catch (e) {
    yield put(setModel({ stateId, model: null }));
    logger.error('[bpmnEditor/fetchModel saga] error', e);
  }
}

export function* runSaveModel({ api, logger }, { payload: { stateId, record, xml, img, deploy } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.cmmn.saveDefinition, record, xml, base64, deploy);

      if (!res.id) {
        throw new Error('res.id is undefined');
      }

      let title = t('success');
      let message = t('editor.success.model-saved');
      if (deploy) {
        message = t('editor.success.model-save-deployed');
      }
      NotificationManager.success(message, title);

      if (deploy) {
        yield put(setLoading({ stateId, isLoading: false }));
      } else {
        yield put(deleteTab(PageTabList.activeTab));
      }
    }
  } catch (e) {
    yield put(setLoading({ stateId, isLoading: false }));

    let message = e.message || t('error');
    let title = t('editor.error.can-not-save-model');
    if (deploy) {
      title = t('editor.error.can-not-save-deploy-model');
    }
    NotificationManager.error(message, title);
    logger.error('[bpmnEditor/runSaveModel saga] error', e);
  }
}

export function* fetchTitle({ api, logger }, { payload: { stateId, record } }) {
  try {
    const title = yield call(api.page.getRecordTitle, record);

    yield put(setTitle({ stateId, title }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    logger.error('[bpmnEditor/fetchTitle saga] error', e);
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
      const addedKeys = [];

      inputs.forEach(input => {
        const component = get(input, 'scope.component', input.component);
        const att = component.key;

        if (addedKeys.includes(att)) {
          return;
        }

        const inputType = component.type;
        const isMultiple = component.multiple;

        let value = BpmnUtils.getValue(element, att);
        if (value != null && value !== '' && (isMultiple === true || JSON_VALUE_COMPONENTS.includes(inputType))) {
          value = isJsonObjectString(value) ? JSON.parse(value) : value;
        }

        if (!isUndefined(value) && !['asyncData'].includes(inputType)) {
          formData[att] = value;
        }

        addedKeys.push(att);
      });

      formData.id = element.id;
    }

    yield put(setFormProps({ stateId, formProps: { ...form, formData } }));
  } catch (e) {
    yield put(setFormProps({ stateId, formProps: {} }));

    NotificationManager.error(t('model-editor.error.form-not-found'), t('error'));
    logger.error('[bpmnEditor/fetchFormProps saga] error', e);
  }
}

function* bpmnEditorSaga(ea) {
  yield takeEvery(initData().type, init, ea);
  yield takeEvery(getModel().type, fetchModel, ea);
  yield takeEvery(saveModel().type, runSaveModel, ea);
  yield takeEvery(getTitle().type, fetchTitle, ea);
  yield takeEvery(getFormProps().type, fetchFormProps, ea);
}

export default bpmnEditorSaga;
