import { delay } from 'redux-saga';
import { put, select, takeEvery, call } from 'redux-saga/effects';
import get from 'lodash/get';
import set from 'lodash/set';

import { selectTypeNames, selectDynamicTypes, selectAvailableTypes, selectConfigTypes, selectDynamicType } from '../selectors/documents';
import {
  init,
  initSuccess,
  getAvailableTypes,
  setAvailableTypes,
  setDynamicTypes,
  getDocumentsByType,
  setDocuments,
  toggleType,
  saveSettings,
  saveSettingsFinally,
  uploadFiles,
  uploadFilesFinally,
  setConfig,
  setUploadError
} from '../actions/documents';
import DocumentsConverter from '../dto/documents';
import { deepClone } from '../helpers/util';

function* sagaInitWidget({ api, logger }, { payload }) {
  try {
    yield put(setConfig({ record: payload.record, config: payload.config }));
    yield* sagaGetAvailableTypes({ api, logger }, { payload: payload.record });
    yield* sagaGetDynamicTypes({ api, logger }, { payload });

    yield put(initSuccess(payload.record));
  } catch (e) {
    logger.error('[documents sagaInitWidget saga error', e.message);
  }
}

function* sagaToggleType({ api, logger }, { payload }) {
  try {
    const availableTypes = yield select(state => selectAvailableTypes(state, payload.record));
    const mutableItem = availableTypes.find(item => item.id === payload.id);
    const dynamicTypes = yield select(state => selectDynamicTypes(state, payload.record));
    const index = dynamicTypes.findIndex(item => item.type === payload.id);
    const typesNames = yield select(state => selectTypeNames(state, payload));

    mutableItem.isSelected = payload.checked;

    if (!~index) {
      const formId = yield call(api.documents.getFormIdByType, payload.id);

      dynamicTypes.push(DocumentsConverter.getFormattedDynamicType({ ...mutableItem, formId }));
    } else {
      dynamicTypes.splice(index, 1);
    }

    // todo: realy need it?
    yield put(
      setAvailableTypes({
        record: payload.record,
        types: availableTypes
      })
    );

    yield put(
      setDynamicTypes({
        record: payload.record,
        dynamicTypes: DocumentsConverter.getDynamicTypes({ types: dynamicTypes, typesNames })
      })
    );
  } catch (e) {
    logger.error('[documents sagaToggleType saga error', e.message);
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

    const { records: countDocuments, errors: documentsErrors } = yield call(
      api.documents.getCountDocumentsByTypes,
      payload.record,
      dynamicTypeKeys
    );

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
      const document = documents[documents.length - 1];

      set(type, 'countDocuments', documents.length);
      set(type, 'loadedBy', document.loadedBy);
      set(type, 'modified', DocumentsConverter.getFormattedDate(document.modified));
    }

    yield put(setDynamicTypes({ record: payload.record, dynamicTypes }));
  } catch (e) {
    logger.error('[documents sagaGetDocumentsByType saga error', e.message);
  }
}

function* sagaSaveSettings({ api, logger }, { payload }) {
  try {
    const dynamicTypeKeys = payload.types.map(record => record.type);

    const { records: countDocuments, errors: documentsErrors } = yield call(
      api.documents.getCountDocumentsByTypes,
      payload.record,
      dynamicTypeKeys
    );

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
          record: payload.record,
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
  yield takeEvery(toggleType().type, sagaToggleType, ea);
  yield takeEvery(saveSettings().type, sagaSaveSettings, ea);
  yield takeEvery(uploadFiles().type, sagaUploadFiles, ea);
}

export default saga;
