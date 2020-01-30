import { delay } from 'redux-saga';
import { put, select, takeEvery, call } from 'redux-saga/effects';
import get from 'lodash/get';
import set from 'lodash/set';
import isArray from 'lodash/isArray';

import { selectTypeNames, selectDynamicTypes, selectAvailableTypes, selectConfigTypes, selectDynamicType } from '../selectors/documents';
import {
  init,
  initSuccess,
  initFinally,
  getAvailableTypes,
  setAvailableTypes,
  setDynamicTypes,
  getDocumentsByType,
  setDocuments,
  saveSettings,
  saveSettingsFinally,
  uploadFiles,
  uploadFilesFinally,
  setConfig,
  setUploadError,
  setActions,
  execRecordsAction
} from '../actions/documents';
import DocumentsConverter from '../dto/documents';
import { deepClone } from '../helpers/util';
import RecordActions from '../components/Records/actions/RecordActions';
import { BackgroundOpenAction } from '../components/Records/actions/DefaultActions';

function* sagaInitWidget({ api, logger }, { payload }) {
  try {
    yield put(setConfig({ record: payload.record, config: payload.config }));
    yield* sagaGetAvailableTypes({ api, logger }, { payload: payload.record });
    yield* sagaGetDynamicTypes({ api, logger }, { payload });
    yield put(initSuccess(payload.record));
  } catch (e) {
    logger.error('[documents sagaInitWidget saga error', e.message);
  } finally {
    yield put(initFinally(payload.record));
  }
}

function* sagaGetDynamicTypes({ api, logger }, { payload }) {
  try {
    const { records: dynamicTypes, errors: dtErrors } = yield call(api.documents.getDynamicTypes, payload.record);

    if (dtErrors.length) {
      throw new Error(dtErrors.join(' '));
    }

    const configTypes = yield select(state => selectConfigTypes(state, payload.record));
    let combinedTypes = DocumentsConverter.combineTypes(dynamicTypes, configTypes);
    const typeNames = yield select(state => selectTypeNames(state, payload.record));
    const dynamicTypeKeys = combinedTypes.map(record => record.type);
    const { records, errors: documentsErrors } = yield call(api.documents.getDocumentsByTypes, payload.record, dynamicTypeKeys);
    const countDocuments = records.map(record => record.documents);

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
      yield put(
        getDocumentsByType({
          record: payload.record,
          type: combinedTypes[0].type
        })
      );
    }

    yield put(
      setDynamicTypes({
        record: payload.record,
        dynamicTypes: DocumentsConverter.getDynamicTypes({ types: combinedTypes, typeNames, countByTypes: countDocuments })
      })
    );

    const types = yield select(state => selectAvailableTypes(state, payload.record));

    yield put(
      setAvailableTypes({
        record: payload.record,
        types
      })
    );
  } catch (e) {
    logger.error('[documents sagaGetDynamicTypes saga error', e.message);
  }
}

function* sagaGetAvailableTypes({ api, logger }, { payload }) {
  try {
    const { records, errors } = yield call(api.documents.getDocumentTypes, payload);

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    yield put(
      setAvailableTypes({
        record: payload,
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
    const typeNames = yield select(state => selectTypeNames(state, payload.record));

    yield put(
      setDocuments({
        record: payload.record,
        documents: DocumentsConverter.getDocuments({
          documents,
          type: payload.type,
          typeName: typeNames[payload.type]
        })
      })
    );

    const dynamicTypes = deepClone(yield select(state => selectDynamicTypes(state, payload.record)));

    if (dynamicTypes.length) {
      const type = dynamicTypes.find(item => item.type === payload.type);
      const document = DocumentsConverter.sortByDate({
        data: documents,
        type: 'desc'
      })[0];

      set(type, 'countDocuments', documents.length);
      set(type, 'loadedBy', document.loadedBy);
      set(type, 'lastDocumentRef', document.id);
      set(type, 'modified', DocumentsConverter.getFormattedDate(document.modified));
    }

    yield put(setDynamicTypes({ record: payload.record, dynamicTypes }));

    const actions = yield RecordActions.getActions(documents.map(item => item.id), {
      actions: ['ui/action$content-download', 'ui/action$view-dashboard', 'ui/action$edit', 'ui/action$delete']
    });

    yield put(setActions({ record: payload.record, actions }));
  } catch (e) {
    logger.error('[documents sagaGetDocumentsByType saga error', e.message);
  }
}

function* sagaExecRecordsAction({ api, logger }, { payload }) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, payload);
    const check = isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;

    if (check) {
      if (get(payload, 'action.type', '') !== BackgroundOpenAction.type) {
        if (typeof payload.callback === 'function') {
          payload.callback(get(payload, 'action.type', ''));
        }
      }
    }
  } catch (e) {
    logger.error('[documents sagaExecRecordsAction saga error', e.message, e);
  }
}

function* sagaSaveSettings({ api, logger }, { payload }) {
  try {
    const dynamicTypeKeys = payload.types.map(record => record.type);
    const { records, errors: documentsErrors } = yield call(api.documents.getDocumentsByTypes, payload.record, dynamicTypeKeys);
    const countDocuments = records.map(record => record.documents);

    yield put(
      setDynamicTypes({
        record: payload.record,
        dynamicTypes: DocumentsConverter.getDynamicTypes({ types: payload.types, countByTypes: countDocuments }), //
        countDocuments
      })
    );

    yield put(init({ record: payload.record, config: payload.config }));
  } catch (e) {
    logger.error('[documents sagaSaveSettings saga error', e.message);
  } finally {
    yield put(saveSettingsFinally(payload.record));
  }
}

function* sagaUploadFiles({ api, logger }, { payload }) {
  try {
    const type = yield select(state => selectDynamicType(state, payload.record, payload.type));

    /**
     * update version
     */
    if (!type.multiple && type.countDocuments > 0) {
      // todo not updated data after uploading (maybe need type)
      yield call(api.versionsJournal.addNewVersion, {
        body: DocumentsConverter.getAddNewVersionFormDataForServer({
          record: type.lastDocumentRef,
          type: payload.type,
          file: payload.files[0]
        }),
        handleProgress: payload.callback
      });
      yield put(getDocumentsByType({ record: payload.record, type: payload.type, delay: 0 }));

      return;
    }

    const results = yield payload.files.map(
      yield function*(file) {
        const formData = new FormData();

        formData.append('file', file);
        formData.append('name', file.name);

        const { nodeRef = null } = yield call(api.documents.uploadFile, formData, payload.callback);

        if (!nodeRef) {
          return null;
        }

        return {
          size: file.size,
          name: file.name,
          data: { nodeRef }
        };
      }
    );

    /**
     * open form manager
     */
    if (type.formId && payload.openForm) {
      payload.openForm(type, results.filter(item => item !== null));

      return;
    }

    yield call(api.documents.uploadFilesWithNodes, {
      record: payload.record,
      type: payload.type,
      content: results.filter(item => item !== null)
    });
    yield put(getDocumentsByType({ record: payload.record, type: payload.type, delay: 0 }));
  } catch (e) {
    yield put(setUploadError({ record: payload.record, message: e.message }));
    logger.error('[documents sagaUploadFiles saga error', e.message);
  } finally {
    yield put(uploadFilesFinally(payload.record));
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInitWidget, ea);
  yield takeEvery(getAvailableTypes().type, sagaGetAvailableTypes, ea);
  yield takeEvery(getDocumentsByType().type, sagaGetDocumentsByType, ea);
  yield takeEvery(saveSettings().type, sagaSaveSettings, ea);
  yield takeEvery(uploadFiles().type, sagaUploadFiles, ea);
  yield takeEvery(execRecordsAction().type, sagaExecRecordsAction, ea);
}

export default saga;
