import { delay } from 'redux-saga';
import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import cloneDeep from 'lodash/cloneDeep';

import { getFirstNonEmpty, isExistValue, t } from '../helpers/util';
import { DEFAULT_REF, documentActions, documentFields } from '../constants/documents';
import recordActions, { ActionTypes } from '../components/Records/actions';
import DocumentsConverter from '../dto/documents';
import { selectIsMobile } from '../selectors/view';
import {
  selectActionsDynamicType,
  selectActionsDynamicTypes,
  selectAvailableType,
  selectAvailableTypes,
  selectColumnsConfig,
  selectConfigTypes,
  selectDynamicType,
  selectDynamicTypes,
  selectIsLoadChecklist,
  selectTypeById
} from '../selectors/documents';
import {
  execRecordsAction,
  execRecordsActionFinally,
  getAvailableTypes,
  getDocumentsByType,
  getDocumentsByTypes,
  getDocumentsFinally,
  getDynamicTypes,
  getTypeSettings,
  initFinally,
  initStore,
  initSuccess,
  saveSettings,
  saveSettingsFinally,
  setActions,
  setAvailableTypes,
  setConfig,
  setDocuments,
  setDocumentsByTypes,
  setDynamicTypes,
  setTypeSettings,
  setTypeSettingsFinally,
  setUploadError,
  setLoadingStatus,
  updateVersion,
  uploadFiles,
  uploadFilesFinally
} from '../actions/documents';
import journalsService from '../components/Journals/service';

function* fillTypeInfo(api, types = []) {
  const typeKeys = types.map(record => record.type);
  const typeInfo = yield call(api.documents.getTypeInfo, typeKeys);

  const fillInfo = types.map((type, index) => ({
    ...type,
    ...get(typeInfo, [index], {})
  }));

  const fillForm = yield fillInfo.map(function*(item) {
    if (item.formId) {
      return item;
    }

    const formId = yield call(api.documents.getFormIdByType, item.type);

    return !formId ? { ...item, formId: null } : { ...item, formId };
  });

  const filtered = fillForm.filter(item => item !== null);

  yield all(
    filtered.map(function*(item) {
      let journalConfig;

      if (!isEmpty(item.journalId)) {
        journalConfig = yield journalsService.getJournalConfig(item.journalId);
      } else {
        journalConfig = yield call(api.documents.getColumnsConfigByType, item.type) || {};
      }

      const columns = DocumentsConverter.getColumnsForGrid(journalConfig.columns);

      DocumentsConverter.setDefaultFormatters(columns);
      item.columns = DocumentsConverter.getColumnForWeb(columns);
      return item;
    })
  );

  return filtered;
}

function* getRecordActionsByType(documentsIds, typeActions) {
  return yield recordActions.getActionsForRecords(documentsIds, getFirstNonEmpty([typeActions], documentActions));
}

function* sagaInitWidget({ api, logger }, { payload }) {
  try {
    yield put(setConfig({ ...payload }));
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
    const configTypes = yield select(state => selectConfigTypes(state, payload.key));

    let dynamicTypes = [];

    if (isLoadChecklist) {
      let dtErrors;
      ({ records: dynamicTypes, errors: dtErrors } = yield call(api.documents.getDynamicTypes, payload.record));

      if (dtErrors.length) {
        throw new Error(dtErrors.map(item => item.msg || item).join(', '));
      }
    }

    let combinedTypes = DocumentsConverter.combineTypes(dynamicTypes, configTypes);

    const { records: documents, errors: documentsErrors } = yield call(
      api.documents.getDocumentsByTypes,
      payload.record,
      combinedTypes.map(record => record.type)
    );

    if (documentsErrors.length) {
      throw new Error(documentsErrors.map(item => item.msg || item).join(', '));
    }

    combinedTypes = yield fillTypeInfo(api, combinedTypes);

    if (combinedTypes.length === 1) {
      yield put(getDocumentsByType({ ...payload, type: combinedTypes[0].type }));
    }

    const countByTypes = documents.map(record => record.documents);
    const filledTypes = DocumentsConverter.getDynamicTypes({ types: combinedTypes, countByTypes });

    yield put(setDynamicTypes({ key: payload.key, dynamicTypes: filledTypes }));
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
  if (isExistValue(payload.loadTypesForAll) && payload.loadTypesForAll) {
    return;
  }

  try {
    yield delay(payload.delay || 1000);

    const attributes = DocumentsConverter.getColumnsAttributes(
      yield select(state => selectColumnsConfig(state, payload.key, payload.type))
    );

    const { records, errors } = yield call(api.documents.getDocumentsByTypes, payload.record, payload.type, attributes);

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    const documents = get(records, '[0].documents', []);
    let dynamicTypes = cloneDeep(yield select(state => selectDynamicTypes(state, payload.key)));
    const type = dynamicTypes.find(item => item.type === payload.type);

    if (type) {
      const document = DocumentsConverter.sortByDate({
        data: documents,
        type: 'desc'
      })[0];

      type[documentFields.loadedBy] = get(document, documentFields.loadedBy, '');
      type[documentFields.modified] = DocumentsConverter.getFormattedDate(get(document, documentFields.modified, ''));

      yield put(setDynamicTypes({ key: payload.key, dynamicTypes }));
    }

    yield put(
      setDocuments({
        key: payload.key,
        documents: DocumentsConverter.getDocuments({ documents, type: payload.type })
      })
    );

    dynamicTypes = cloneDeep(yield select(state => selectDynamicTypes(state, payload.key)));

    if (dynamicTypes.length) {
      const type = dynamicTypes.find(item => item.type === payload.type);
      const document = DocumentsConverter.sortByDate({
        data: documents,
        type: 'desc'
      })[0];

      set(type, 'countDocuments', documents.length);
      set(type, 'loadedBy', get(document, 'loadedBy', ''));
      set(type, 'lastDocumentRef', get(document, documentFields.id, ''));
      set(type, 'modified', DocumentsConverter.getFormattedDate(get(document, 'modified', '')));
    }

    yield put(setDynamicTypes({ key: payload.key, dynamicTypes }));

    if (documents.length) {
      const typeActions = yield select(state => selectActionsDynamicType(state, payload.key, payload.type));
      const recActions = yield getRecordActionsByType(documents.map(item => item[documentFields.id]), typeActions);

      yield put(setActions({ key: payload.key, actions: recActions.forRecord }));
    }
  } catch (e) {
    logger.error('[documents sagaGetDocumentsByType saga error', e.message);
  } finally {
    yield put(getDocumentsFinally({ key: payload.key }));
  }
}

function* sagaExecRecordsAction({ api, logger }, { payload }) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, payload);
    const check = isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;
    const actionType = get(payload, 'action.type', '');

    if (check) {
      if (actionType !== ActionTypes.BACKGROUND_VIEW) {
        if (typeof payload.callback === 'function') {
          payload.callback(actionType);
        }
      }
    }

    if (actionType === ActionTypes.CREATE) {
      if (typeof payload.callback === 'function') {
        payload.callback(actionType);
      }
    }
  } catch (e) {
    logger.error('[documents sagaExecRecordsAction saga error', e.message, e);
  } finally {
    const loadTypesForAll = yield select(state => state.view.isMobile);
    yield put(execRecordsActionFinally({ ...payload, loadTypesForAll }));
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

    if (!isEmpty(payload.selectedType)) {
      yield put(
        setLoadingStatus({
          key: payload.key,
          loadingField: 'isLoading',
          status: true
        })
      );
      yield* sagaInitWidget({ api, logger }, { payload: { ...payload, type: payload.selectedType } });
    } else {
      yield put(initStore({ ...payload }));
    }
  } catch (e) {
    logger.error('[documents sagaSaveSettings saga error', e.message);
  } finally {
    if (!isEmpty(payload.selectedType)) {
      yield put(
        setLoadingStatus({
          key: payload.key,
          loadingField: 'isLoading',
          status: true
        })
      );
      yield* sagaGetDocumentsByType({ api, logger }, { payload: { ...payload, type: payload.selectedType } });
      yield put(
        setLoadingStatus({
          key: payload.key,
          loadingField: 'isLoading',
          status: false
        })
      );
    }

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

export function* uploadFile({ api, file, callback }) {
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
      yield call(sagaUpdateVersion, { api, logger }, { payload });

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

    yield put(getDocumentsByType({ ...payload }));

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
    yield put(getDocumentsByTypes({ ...payload, delay: 1000 }));
  }
}

function* sagaGetTypeSettings({ api, logger }, { payload }) {
  try {
    let type = yield select(state => selectDynamicType(state, payload.key, payload.type));

    if (!type) {
      type = DocumentsConverter.getFormattedDynamicType(yield select(state => selectAvailableType(state, payload.key, payload.type)));
    }

    if (!type) {
      return Promise.reject('Error: Type not found');
    }

    const config = yield call(api.documents.getColumnsConfigByType, payload.type);
    const columns = DocumentsConverter.getColumnsForSettings(get(config, 'columns', []));

    yield put(
      setTypeSettings({
        ...payload,
        settings: {
          multiple: type.multiple,
          canUpload: type.canUpload,
          columns
        }
      })
    );
  } catch (e) {
    logger.error('[documents sagaGetTypeSettings saga error', e.message);
  } finally {
    yield put(setTypeSettingsFinally(payload.key));
  }
}

function* sagaGetDocumentsByTypes({ api, logger }, { payload }) {
  const isMobile = yield select(selectIsMobile);

  if ((isExistValue(payload.loadTypesForAll) && !payload.loadTypesForAll) || !isMobile) {
    return;
  }

  try {
    if (payload.delay !== undefined) {
      yield delay(payload.delay);
    }

    const documentsByTypes = {};
    const documentsIds = [];
    const types = yield select(state => selectDynamicTypes(state, payload.key));
    const { records, errors } = yield call(api.documents.getDocumentsByTypes, payload.record, types.map(item => item.type));

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    types.forEach((item, index) => {
      const documents = get(records, `[${index}].documents`, []);

      documentsByTypes[item.type] = documents;
      documentsIds.push(...documents.map(doc => doc[documentFields.id]));
    });

    if (documentsIds.length) {
      const typeActions = yield select(state => selectActionsDynamicTypes(state, payload.key, payload.type));
      const actions = yield getRecordActionsByType(documentsIds, typeActions);

      yield put(setActions({ key: payload.key, actions: actions.forRecord }));
    }

    yield put(setDocumentsByTypes({ ...payload, documentsByTypes }));
  } catch (e) {
    logger.error('[documents sagaGetDocumentsByTypes saga error] ', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(initStore().type, sagaInitWidget, ea);
  yield takeEvery(getAvailableTypes().type, sagaGetAvailableTypes, ea);
  yield takeEvery([getDocumentsByType().type, execRecordsActionFinally().type], sagaGetDocumentsByType, ea);
  yield takeEvery([getDocumentsByTypes().type, execRecordsActionFinally().type], sagaGetDocumentsByTypes, ea);
  yield takeEvery([getDynamicTypes().type, execRecordsActionFinally().type], sagaGetDynamicTypes, ea);
  yield takeEvery(saveSettings().type, sagaSaveSettings, ea);
  yield takeEvery(uploadFiles().type, sagaUploadFiles, ea);
  yield takeEvery(updateVersion().type, sagaUpdateVersion, ea);
  yield takeEvery(execRecordsAction().type, sagaExecRecordsAction, ea);
  yield takeEvery(getTypeSettings().type, sagaGetTypeSettings, ea);
}

export default saga;
