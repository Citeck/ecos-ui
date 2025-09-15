import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import set from 'lodash/set';
import { delay } from 'redux-saga';
import { all, call, put, select, takeEvery } from 'redux-saga/effects';

import {
  downloadAllDocuments,
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
  setDownloadLoading,
  setDynamicTypes,
  setLoadingStatus,
  setTypeSettings,
  setTypeSettingsFinally,
  setUploadError,
  updateVersion,
  uploadFiles,
  uploadFilesFinally
} from '../actions/documents';
import journalsService from '../components/Journals/service';
import Records from '../components/Records';
import recordActions from '../components/Records/actions';
import { ActionTypes } from '../components/Records/actions/constants';
import ServerGroupActionV2 from '../components/Records/actions/handler/executor/ServerGroupActionV2';
import { documentActions, documentFields } from '../constants/documents';
import DocumentsConverter from '../dto/documents';
import { getFirstNonEmpty, isNodeRef, t } from '../helpers/util';
import {
  selectActions,
  selectActionsByTypes,
  selectActionsDynamicType,
  selectAvailableType,
  selectAvailableTypes,
  selectColumnsConfig,
  selectConfigTypes,
  selectDynamicType,
  selectDynamicTypes,
  selectIsLoadChecklist,
  selectTypeById
} from '../selectors/documents';
import { getStore } from '../store';

import { NotificationManager } from '@/services/notifications';

function* fillTypeInfo(api, types = []) {
  const typeKeys = types.map(record => record.type);
  const typeInfo = yield call(api.documents.getTypeInfo, typeKeys);

  const fillInfo = types.map((type, index) => ({
    ...type,
    ...get(typeInfo, [index], {})
  }));

  const fillForm = yield fillInfo.map(function* (item) {
    if (item.formId) {
      return item;
    }

    const formId = yield call(api.documents.getFormIdByType, item.type);

    return !formId ? { ...item, formId: null } : { ...item, formId };
  });

  const filtered = fillForm.filter(item => item !== null);

  yield all(
    filtered.map(function* (item) {
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

function* sagaInitWidget({ api }, { payload }) {
  try {
    yield put(setConfig({ ...payload }));
    yield* sagaGetDynamicTypes({ api }, { payload: { ...payload } });
    yield put(initSuccess(payload.key));
  } catch (e) {
    console.error('[documents sagaInitWidget saga error', e);
  } finally {
    yield put(initFinally(payload.key));
  }
}

function* sagaGetDynamicTypes({ api }, { payload }) {
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

    combinedTypes = yield Promise.all(
      combinedTypes.map(async item => {
        const getParents = async type => {
          const parents = [];
          const parent = await api.documents.getParent(type);

          if (parent.id) {
            const parentOfParent = await getParents(parent.id);

            parents.push(parent.name, ...parentOfParent);
          }

          return parents;
        };
        const parent = await getParents(item.type);

        return {
          ...item,
          breadcrumbs: parent.reverse()
        };
      })
    );

    const countByTypes = documents.map(record => record.documents);
    const filledTypes = DocumentsConverter.getDynamicTypes({ types: combinedTypes, countByTypes });

    // TODO: Check if it's necessary
    yield Promise.all(
      filledTypes.map(async item => {
        item.columns = await journalsService.resolveColumns(item.columns);

        return item;
      })
    );

    yield put(setDynamicTypes({ key: payload.key, dynamicTypes: filledTypes }));
  } catch (e) {
    console.error('[documents sagaGetDynamicTypes saga error', e);
    NotificationManager.error(t('documents-widget.error.upload-filed'), t('error'));
  }
}

function* sagaDownloadAllDocuments({ api }, { payload }) {
  try {
    yield put(setDownloadLoading({ ...payload, loading: true }));
    const allDocuments = payload.allDocuments;
    if (isNodeRef(payload.record)) {
      yield call(api.documents.downloadAllDocumentsWithAlfresco, allDocuments);
    } else {
      const groupActionHandler = new ServerGroupActionV2();
      const records = allDocuments.map(r => ({ id: r }));
      const result = yield Promise.all([
        groupActionHandler.execForRecords(records, {
          config: {
            targetApp: 'transformations',
            valuesParams: {
              type: 'records-list',
              config: {
                records: allDocuments
              }
            },
            executionParams: {
              type: 'export-zip'
            }
          }
        })
      ]);

      window.location.assign(get(result, '[0].data.url'));
    }
    yield put(setDownloadLoading({ ...payload, loading: false }));
  } catch (e) {
    yield put(setDownloadLoading({ ...payload, loading: false }));
    console.error('[documents sagaDownloadAllDocuments saga error', e);
  }
}

function* sagaGetAvailableTypes({ api }, { payload }) {
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
    console.error('[documents sagaGetAvailableTypes saga error', e);
  }
}

function* sagaGetDocumentsByType({ api }, { payload }) {
  if (!isNil(payload.loadTypesForAll) && payload.loadTypesForAll) {
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
      const recActions = yield getRecordActionsByType(
        documents.map(item => item[documentFields.id]),
        typeActions
      );

      yield put(setActions({ key: payload.key, actions: recActions.forRecord }));
    }
  } catch (e) {
    console.error('[documents sagaGetDocumentsByType saga error', e);
  } finally {
    yield put(getDocumentsFinally({ key: payload.key }));
  }
}

function* sagaExecRecordsAction({ api }, { payload }) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, payload);
    const check = isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;
    const actionType = get(payload, 'action.type', '');

    if (check) {
      if (actionType !== ActionTypes.BACKGROUND_VIEW) {
        if (isFunction(payload.callback)) {
          payload.callback(actionType);
        }
      }
    }

    if (actionType === ActionTypes.CREATE) {
      if (isFunction(payload.callback)) {
        payload.callback(actionType);
      }
    }

    Records.get(payload.record).update();
  } catch (e) {
    console.error('[documents sagaExecRecordsAction saga error', e);
  } finally {
    const loadTypesForAll = yield select(state => state.view.isMobile);
    if (loadTypesForAll) {
      yield put(execRecordsActionFinally({ ...payload, loadTypesForAll }));
    }
  }
}

function* sagaSaveSettings({ api }, { payload }) {
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
      yield* sagaInitWidget({ api }, { payload: { ...payload, type: payload.selectedType } });
    } else {
      yield put(initStore({ ...payload }));
    }
  } catch (e) {
    console.error('[documents sagaSaveSettings saga error', e);
  } finally {
    if (!isEmpty(payload.selectedType)) {
      yield put(
        setLoadingStatus({
          key: payload.key,
          loadingField: 'isLoading',
          status: true
        })
      );
      yield* sagaGetDocumentsByType({ api }, { payload: { ...payload, type: payload.selectedType } });
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

function* sagaUpdateVersion({ api }, { payload }) {
  try {
    const type = yield select(state => selectDynamicType(state, payload.key, payload.type));

    let entityRef = type.lastDocumentRef;
    if (isNodeRef(entityRef)) {
      yield call(api.versionsJournal.addNewVersion, {
        body: DocumentsConverter.getAddNewVersionFormDataForServer({
          record: type.lastDocumentRef,
          type: payload.type,
          file: payload.files[0]
        }),
        handleProgress: payload.callback
      });
    } else {
      const fileUploadRes = yield uploadFileV2({
        api,
        file: payload.files[0],
        callback: payload.callback
      });
      const tempFileRef = get(fileUploadRes, 'data.entityRef');
      if (!tempFileRef) {
        throw new Error('TempFile ref is empty after uploading');
      }
      const record = Records.get(entityRef);
      record.att('_content', tempFileRef);

      yield record.save();
    }
    yield put(getDocumentsByType({ ...payload, delay: 0 }));

    NotificationManager.success(t('documents-widget.notification.update.success'), t('success'));
  } catch (e) {
    console.error('[documents sagaUpdateVerion saga error]', e);
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
    console.error('[documents uploadFile error]', e);

    return Promise.reject(e);
  }
}

export function* uploadFileV2({ api, file, callback, type }) {
  try {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('name', file.name);

    if (!!type) {
      formData.append('ecosType', type);
    }

    const { entityRef = null } = yield call(api.app.uploadFileV2, formData, callback);

    if (!entityRef) {
      return Promise.reject('Error: No file entityRef');
    }

    return {
      size: file.size,
      name: file.name,
      data: { entityRef }
    };
  } catch (e) {
    console.error('[documents uploadFile error]', e);

    return Promise.reject(e);
  }
}

function* formManager({ api, payload, files }) {
  try {
    const createVariants = yield call(api.documents.getCreateVariants, payload.type);

    const type = yield select(state => {
      const selectedType = selectTypeById(state, payload.key, payload.type);

      if (isEmpty(selectedType)) {
        return selectDynamicType(state, payload.key, payload.type);
      }

      return selectedType;
    });

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
        ...createVariants
      }),
      {
        onModalCancel: () => {
          const store = getStore();

          store.dispatch(
            setLoadingStatus({
              key: payload.key,
              loadingField: 'isLoading',
              status: false
            })
          );
        }
      }
    );
  } catch (e) {
    console.error('[documents formManager error]', e);

    return Promise.reject(e);
  }
}

function* sagaUploadFiles({ api }, { payload }) {
  try {
    const type = yield select(state => selectDynamicType(state, payload.key, payload.type));
    const createVariants = yield call(api.documents.getCreateVariants, payload.type);

    let isRejected = false;
    const rejectedMessages = [];

    /**
     * update version
     */
    if (!type.multiple && type.countDocuments > 0) {
      yield call(sagaUpdateVersion, { api }, { payload });

      return;
    }

    let fileUploadFunc;
    if (isNodeRef(payload.record)) {
      fileUploadFunc = uploadFile;
    } else {
      fileUploadFunc = uploadFileV2;
    }
    const files = yield all(
      payload.files.map(function* (file) {
        return yield fileUploadFunc({ api, file, callback: payload.callback });
      })
    );

    const results = yield Promise.allSettled(files);
    results.forEach(result => {
      if (result.status === 'rejected') {
        rejectedMessages.push(result.reason);
        isRejected = true;
      }
    });

    const rejectedMsg = rejectedMessages.join('\n');

    if (isRejected) {
      if (rejectedMsg) {
        NotificationManager.error(rejectedMsg);
      }

      return;
    }

    /**
     * open form manager
     */
    if ((type.formId || (createVariants != null && createVariants.formRef)) && payload.openForm) {
      yield* formManager({ api, payload, files });

      return;
    }

    let recordRef = get(createVariants, 'recordRef');
    if (!recordRef) {
      recordRef = (yield Records.get(payload.type).load('sourceId')) + '@';
    }

    for (const file of files) {
      yield call(
        api.documents.uploadFilesWithNodes,
        DocumentsConverter.getUploadAttributes({
          record: payload.record,
          type: payload.type,
          content: file,
          createVariants
        }),
        recordRef
      );
    }

    Records.get(payload.record).update();

    NotificationManager.success(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.success' : 'documents-widget.notification.add-one.success')
    );
  } catch (e) {
    yield put(setUploadError({ ...payload, message: e.message }));
    console.error('[documents sagaUploadFiles saga error', e);
    NotificationManager.error(
      t(payload.files.length > 1 ? 'documents-widget.notification.add-many.error' : 'documents-widget.notification.add-one.error'),
      t('error')
    );
  } finally {
    yield put(setLoadingStatus({ key: payload.key, loadingField: 'isLoading', status: true }));
    yield put(uploadFilesFinally(payload.key));
    yield put(getDocumentsByTypes({ ...payload, delay: 1000 }));
    yield put(getDocumentsByType({ ...payload }));
    yield put(setLoadingStatus({ key: payload.key, loadingField: 'isLoading', status: false }));
  }
}

function* sagaGetTypeSettings({ api }, { payload }) {
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
    console.error('[documents sagaGetTypeSettings saga error', e);
  } finally {
    yield put(setTypeSettingsFinally(payload.key));
  }
}

function* sagaGetDocumentsByTypes({ api }, { payload }) {
  if (!isNil(payload.loadTypesForAll) && !payload.loadTypesForAll) {
    yield put(
      setLoadingStatus({
        key: payload.key,
        loadingField: 'isLoading',
        status: false
      })
    );
    return;
  }

  try {
    if (payload.delay !== undefined) {
      yield delay(payload.delay);
    }

    const documentsByTypes = {};
    const documentsIds = [];
    const types = yield select(state => selectDynamicTypes(state, payload.key));
    const { records, errors } = yield call(
      api.documents.getDocumentsByTypes,
      payload.record,
      types.map(item => item.type)
    );
    let actionsByRecordsFromTypes = {};

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    yield Promise.all(
      types.map(async (item, index) => {
        const documents = get(records, `[${index}].documents`, []);

        documentsByTypes[item.type] = documents;
        documentsIds.push(...documents.map(doc => doc[documentFields.id]));

        if (!isEmpty(item.actions)) {
          const actions = await recordActions.getActionsForRecords(documentsIds, item.actions);

          actionsByRecordsFromTypes = {
            ...actionsByRecordsFromTypes,
            ...get(actions, 'forRecord', {})
          };
        }
      })
    );

    const existActions = yield select(state => selectActions(state, payload.key));

    if (documentsIds.length) {
      const typeActions = yield select(state =>
        selectActionsByTypes(
          state,
          payload.key,
          types.map(item => item.type)
        )
      );
      const actions = yield getRecordActionsByType(documentsIds, typeActions);

      yield put(
        setActions({
          key: payload.key,
          actions: {
            ...actions.forRecord,
            ...actionsByRecordsFromTypes,
            ...existActions
          }
        })
      );
    }

    yield put(setDocumentsByTypes({ ...payload, documentsByTypes }));
  } catch (e) {
    console.error('[documents sagaGetDocumentsByTypes saga error] ', e);
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
  yield takeEvery(downloadAllDocuments().type, sagaDownloadAllDocuments, ea);
}

export default saga;
