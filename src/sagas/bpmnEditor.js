import get from 'lodash/get';
import isUndefined from 'lodash/isUndefined';
import { call, put, takeEvery } from 'redux-saga/effects';

import { updateModels } from '../actions/bpmn';
import {
  getFormProps,
  getModel,
  getTitle,
  getHasDeployRights,
  setHasDeployRights,
  initData,
  saveModel,
  setFormProps,
  setLoading,
  setModel,
  setTitle
} from '../actions/bpmnEditor';
import { PROCESS_DEF_API_ACTIONS } from '../api/process';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import * as BpmnUtils from '../components/ModelEditor/BPMNModeler/utils';
import { SourcesId } from '../constants';
import { JSON_VALUE_COMPONENTS, KEY_FIELD_NAME, ML_POSTFIX } from '../constants/cmmn';
import { t } from '../helpers/export/util';
import { isJsonObjectString } from '../helpers/util';

import { TYPE_BPMN_ANNOTATION } from '@/constants/bpmn';
import { NotificationManager } from '@/services/notifications';

export function* init({ api }, { payload: { stateId, record } }) {
  try {
    yield put(getTitle({ stateId, record }));
    yield put(getModel({ stateId, record }));
    yield put(getHasDeployRights({ stateId, record }));
  } catch (e) {
    console.error('[bpmnEditor/init saga] error', e);
  }
}

export function* fetchModel({ api }, { payload: { stateId, record } }) {
  try {
    const sectionPath = yield call(api.process.getSectionPath, record);
    const model = yield call(api.process.getDefinition, record);

    yield put(setModel({ stateId, model, sectionPath }));
  } catch (e) {
    yield put(setModel({ stateId, model: null }));
    console.error('[bpmnEditor/fetchModel saga] error', e);
  }
}

export function* runSaveModel({ api }, { payload: { stateId, record, xml, img, definitionAction, processDefId } }) {
  try {
    if (xml && img) {
      const base64 = yield call(api.app.getBase64, new Blob([img], { type: 'image/svg+xml' }));
      const res = yield call(api.process.saveDefinition, record, xml, base64, definitionAction);

      if (!res.id) {
        throw new Error('res.id is undefined');
      }

      let title = t('success');
      let message = t('editor.success.model-saved');
      if (definitionAction === PROCESS_DEF_API_ACTIONS.DEPLOY) {
        message = t('editor.success.model-save-deployed');
      }
      NotificationManager.success(message, title);

      const updatePayload = {
        action: 'edit',
        modelId: record,
        resultModelId: processDefId ? `${SourcesId.BPMN_DEF}@${processDefId}` : record
      };

      yield put(updateModels(updatePayload));
      yield put(setLoading({ stateId, isLoading: false }));

      yield put(getModel({ stateId, record }));
    }
  } catch (e) {
    yield put(setLoading({ stateId, isLoading: false }));

    let message = e.message || t('error');
    let title = t('editor.error.can-not-save-model');
    if (definitionAction === PROCESS_DEF_API_ACTIONS.DEPLOY) {
      title = t('editor.error.can-not-save-deploy-model');
    }
    NotificationManager.error(message, title);
    console.error('[bpmnEditor/runSaveModel saga] error', e);
  }
}

export function* fetchTitle({ api }, { payload: { stateId, record } }) {
  try {
    const title = yield call(api.page.getRecordTitle, record);

    yield put(setTitle({ stateId, title }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    console.error('[bpmnEditor/fetchTitle saga] error', e);
  }
}

export function* fetchHasDeployRights({ api }, { payload: { stateId, record } }) {
  try {
    const hasDeployRights = yield call(api.process.getHasDeployRights, record);

    yield put(setHasDeployRights({ stateId, hasDeployRights }));
  } catch (e) {
    console.error('[bpmnEditor/fetchHasDeployRights saga] error', e);
  }
}

export function* fetchFormProps({ api }, { payload: { stateId, formId, element, cacheLabels } }) {
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

        if (cacheLabels && att === KEY_FIELD_NAME + ML_POSTFIX && isUndefined(value) && element.type === TYPE_BPMN_ANNOTATION) {
          value = get(cacheLabels, [element.id, att]);
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
    console.error('[bpmnEditor/fetchFormProps saga] error', e);
  }
}

function* bpmnEditorSaga(ea) {
  yield takeEvery(initData().type, init, ea);
  yield takeEvery(getModel().type, fetchModel, ea);
  yield takeEvery(saveModel().type, runSaveModel, ea);
  yield takeEvery(getHasDeployRights().type, fetchHasDeployRights, ea);
  yield takeEvery(getTitle().type, fetchTitle, ea);
  yield takeEvery(getFormProps().type, fetchFormProps, ea);
}

export default bpmnEditorSaga;
