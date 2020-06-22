import { delay } from 'redux-saga';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';

import { NotificationManager } from 'react-notifications';

import {
  selectActionsByType,
  selectAvailableTypes,
  selectConfigTypes,
  selectDynamicType,
  selectDynamicTypes,
  selectIsLoadChecklist,
  selectTypeById,
  selectTypeNames
} from '../selectors/documents';
import {
  execRecordsAction,
  getAvailableTypes,
  getDocumentsByType,
  getDynamicTypes,
  initFinally,
  initStore,
  initSuccess,
  saveSettings,
  saveSettingsFinally,
  setActions,
  setAvailableTypes,
  setConfig,
  setDocuments,
  setDynamicTypes,
  setUploadError,
  updateVersion,
  uploadFiles,
  uploadFilesFinally
} from '../actions/documents';
import DocumentsConverter from '../dto/documents';
import { deepClone, getFirstNonEmpty, t } from '../helpers/util';
import RecordActions from '../components/Records/actions/RecordActions';
import { BackgroundOpenAction, CreateNodeAction } from '../components/Records/actions/DefaultActions';
import { DEFAULT_REF, documentActions } from '../constants/documents';

function* sagaInitWidget({ api, logger }, { payload }) {
  try {
    yield put(setConfig({ ...payload }));
    yield* sagaGetAvailableTypes({ api, logger }, { payload: payload.key });
    yield* sagaGetDynamicTypes({ api, logger }, { payload: { ...payload } });
    yield put(initSuccess(payload.key));
  } catch (e) {
    logger.error('[documents sagaInitWidget saga error', e.message);
  } finally {
    yield put(initFinally(payload.key));
  }
}

function* sagaGetDynamicTypes({ api, logger }, { payload }) {
  try {
    const isLoadChecklist = yield select(state => selectIsLoadChecklist(state, payload.key));
    const typeNames = yield select(state => selectTypeNames(state, payload.key));
    const availableTypes = yield select(state => selectAvailableTypes(state, payload.key));
    let dynamicTypes = [];

    if (isLoadChecklist) {
      const { records, errors: dtErrors } = yield call(api.documents.getDynamicTypes, payload.record);

      if (dtErrors.length) {
        throw new Error(dtErrors.join(' '));
      }

      dynamicTypes = DocumentsConverter.getDynamicTypes({ types: records, typeNames, availableTypes }, true);
    }

    const configTypes = yield select(state => selectConfigTypes(state, payload.key));
    let combinedTypes = DocumentsConverter.combineTypes(dynamicTypes, configTypes);
    const dynamicTypeKeys = combinedTypes.map(record => record.type);
    const { records: documents, errors: documentsErrors } = yield call(api.documents.getDocumentsByTypes, payload.record, dynamicTypeKeys);
    const countDocuments = documents.map(record => record.documents);

    if (documentsErrors.length) {
      throw new Error(documentsErrors.join(' '));
    }

    combinedTypes = yield combinedTypes.map(function*(item) {
      if (item.formId) {
        return item;
      }

      const formId = yield call(api.documents.getFormIdByType, item.type);

      if (!formId) {
        return {
          ...item,
          formId: null
        };
      }

      return {
        ...item,
        formId
      };
    });

    combinedTypes = combinedTypes.filter(item => item !== null);

    if (combinedTypes.length === 1) {
      yield put(getDocumentsByType({ ...payload, type: combinedTypes[0].type }));
    }

    yield put(
      setDynamicTypes({
        key: payload.key,
        dynamicTypes: DocumentsConverter.getDynamicTypes({ types: combinedTypes, typeNames, countByTypes: countDocuments, availableTypes })
      })
    );

    const types = yield select(state => selectAvailableTypes(state, payload.key));

    yield put(
      setAvailableTypes({
        key: payload.key,
        types
      })
    );
  } catch (e) {
    logger.error('[documents sagaGetDynamicTypes saga error', e.message);
  }
}

function* sagaGetAvailableTypes({ api, logger }, { payload }) {
  try {
    const { records, errors } = yield call(api.documents.getDocumentTypes);

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    yield put(
      setAvailableTypes({
        key: payload,
        types: DocumentsConverter.getAvailableTypes(records)
      })
    );
  } catch (e) {
    logger.error('[documents sagaGetAvailableTypes saga error', e.message);
  }
}

function* sagaGetDocumentsByType({ api, logger }, { payload }) {
  try {
    yield delay(payload.delay || 1000);

    const { records, errors } = yield call(api.documents.getDocumentsByTypes, payload.record, payload.type);

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    const documents = get(records, '[0].documents', []);
    const typeNames = yield select(state => selectTypeNames(state, payload.key));

    yield put(
      setDocuments({
        key: payload.key,
        documents: DocumentsConverter.getDocuments({
          documents,
          type: payload.type,
          typeName: typeNames[payload.type]
        })
      })
    );

    const dynamicTypes = deepClone(yield select(state => selectDynamicTypes(state, payload.key)));

    if (dynamicTypes.length) {
      const type = dynamicTypes.find(item => item.type === payload.type);
      const document = DocumentsConverter.sortByDate({
        data: documents,
        type: 'desc'
      })[0];

      set(type, 'countDocuments', documents.length);
      set(type, 'loadedBy', get(document, 'loadedBy', ''));
      set(type, 'lastDocumentRef', get(document, 'id', ''));
      set(type, 'modified', DocumentsConverter.getFormattedDate(get(document, 'modified', '')));
    }

    yield put(setDynamicTypes({ key: payload.key, dynamicTypes }));

    if (documents.length) {
      const typeActions = yield select(state => selectActionsByType(state, payload.key, payload.type));
      const actions = yield RecordActions.getActions(documents.map(item => item.id), {
        actions: getFirstNonEmpty([typeActions, documentActions], [])
      });

      yield put(setActions({ key: payload.key, actions }));
    }
  } catch (e) {
    logger.error('[documents sagaGetDocumentsByType saga error', e.message);
  }
}

function* sagaExecRecordsAction({ api, logger }, { payload }) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, payload);
    const check = isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;
    const actionType = get(payload, 'action.type', '');

    if (check) {
      if (actionType !== BackgroundOpenAction.type) {
        if (typeof payload.callback === 'function') {
          payload.callback(actionType);
        }
      }
    }

    if (actionType === CreateNodeAction.type) {
      if (typeof payload.callback === 'function') {
        payload.callback(actionType);
      }
    }
  } catch (e) {
    logger.error('[documents sagaExecRecordsAction saga error', e.message, e);
  }
}

function* sagaSaveSettings({ api, logger }, { payload }) {
  try {
    const dynamicTypeKeys = payload.types.map(record => record.type);
    const { records } = yield call(api.documents.getDocumentsByTypes, payload.record, dynamicTypeKeys);
    const countDocuments = records.map(record => record.documents);
    const availableTypes = yield select(state => selectAvailableTypes(state, payload.key));

    yield put(
      setDynamicTypes({
        key: payload.key,
        dynamicTypes: DocumentsConverter.getDynamicTypes({ types: payload.types, countByTypes: countDocuments, availableTypes }),
        countDocuments
      })
    );

    yield put(initStore({ ...payload }));
  } catch (e) {
    logger.error('[documents sagaSaveSettings saga error', e.message);
  } finally {
    yield put(saveSettingsFinally(payload.key));
  }
}

function* sagaUpdateVersion({ api, logger }, { payload }) {
  try {
    const type = yield select(state => selectDynamicType(state, payload.key, payload.type));

    yield call(api.versionsJournal.addNewVersion, {
      body: DocumentsConverter.getAddNewVersionFormDataForServer({
        record: type.lastDocumentRef,
        type: payload.type,
        file: payload.files[0]
      }),
      handleProgress: payload.callback
    });
    yield put(getDocumentsByType({ ...payload, delay: 0 }));

    NotificationManager.success(t('documents-widget.notification.update.success'), t('success'));
  } catch (e) {
    logger.error('[documents sagaUpdateVerion saga error]', e.message);
    NotificationManager.error(t('documents-widget.notification.update.error'), t('error'));
  }
}

function* uploadFile({ api, file, callback }) {
  try {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('name', file.name);

    const { nodeRef = null } = yield call(api.app.uploadFile, formData, callback);

    if (!nodeRef) {
      return Promise.reject('Error: No file nodeRef');
    }

    return {
      size: file.size,
      name: file.name,
      data: { nodeRef }
    };
  } catch (e) {
    console.error('[documents uploadFile error]', e.message);

    return Promise.reject(e);
  }
}

function* formManager({ api, payload, files }) {
  try {
    const createVariants = yield call(api.documents.getCreateVariants, payload.type);
    const type = yield select(state => selectTypeById(state, payload.key, payload.type));

    if (isEmpty(createVariants)) {
      payload.openForm(
        DocumentsConverter.getDataToCreate({
          ...payload.type,
          files,
          record: payload.record
        })
      );

      return;
    }

    payload.openForm(
      DocumentsConverter.getDataToCreate({
        record: payload.record,
        type: payload.type,
        formId: type.formId,
        files,
        createVariants
      })
    );
  } catch (e) {
    console.error('[documents formManager error]', e.message);

    return Promise.reject(e);
  }
}

function* sagaUploadFiles({ api, logger }, { payload }) {
  try {
    const type = yield select(state => selectDynamicType(state, payload.key, payload.type));
    const createVariants = yield call(api.documents.getCreateVariants, payload.type);

    /**
     * update version
     */
    if (!type.multiple && type.countDocuments > 0) {
      yield put(updateVersion(payload));

      return;
    }

    const files = yield payload.files.map(function*(file) {
      return yield uploadFile({ api, file, callback: payload.callback });
    });

    /**
     * open form manager
     */
    if ((type.formId || (createVariants != null && createVariants.formRef)) && payload.openForm) {
      yield* formManager({ api, payload, files });

      return;
    }

    yield files.map(function*(file) {
      return yield call(
        api.documents.uploadFilesWithNodes,
        DocumentsConverter.getUploadAttributes({
          record: payload.record,
          type: payload.type,
          content: file,
          createVariants
        }),
        get(createVariants, 'recordRef', DEFAULT_REF)
      );
    });

    yield put(getDocumentsByType({ ...payload, delay: 0 }));

    NotificationManager.success(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.success' : 'documents-widget.notification.add-one.success')
    );
  } catch (e) {
    yield put(setUploadError({ ...payload, message: e.message }));
    logger.error('[documents sagaUploadFiles saga error', e.message);
    NotificationManager.error(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.error' : 'documents-widget.notification.add-one.error'),
      t('error')
    );
  } finally {
    yield put(uploadFilesFinally(payload.key));
  }
}

function* saga(ea) {
  yield takeEvery(initStore().type, sagaInitWidget, ea);
  yield takeEvery(getAvailableTypes().type, sagaGetAvailableTypes, ea);
  yield takeEvery(getDocumentsByType().type, sagaGetDocumentsByType, ea);
  yield takeEvery(getDynamicTypes().type, sagaGetDynamicTypes, ea);
  yield takeEvery(saveSettings().type, sagaSaveSettings, ea);
  yield takeEvery(uploadFiles().type, sagaUploadFiles, ea);
  yield takeEvery(updateVersion().type, sagaUpdateVersion, ea);
  yield takeEvery(execRecordsAction().type, sagaExecRecordsAction, ea);
}

export default saga;
