import { put, select, takeEvery, call } from 'redux-saga/effects';
import set from 'lodash/set';

import { selectTypeNames, selectDynamicTypes, getDynamicTypes, selectAvailableTypes } from '../selectors/documents';
import { init, getAvailableTypes, setAvailableTypes, setDynamicTypes, getDocumentsByType, setDocuments } from '../actions/documents';
import DocumentsConverter from '../dto/documents';

function* sagaInitWidget({ api, logger }, { payload }) {
  try {
    yield* sagaGetAvailableTypes({ api, logger }, { payload });
    yield* sagaGetDynamicTypes({ api, logger }, { payload });
  } catch (e) {
    logger.error('[documents sagaInitWidget saga error', e.message);
  }
}

function* sagaGetDynamicTypes({ api, logger }, { payload }) {
  try {
    const { records: dynamicTypes, errors: dtErrors } = yield call(api.documents.getDynamicTypes, payload);

    if (dtErrors.length) {
      throw new Error(dtErrors.join(' '));
    }

    const typesNames = yield select(state => selectTypeNames(state, payload));
    const dynamicTypeKeys = dynamicTypes.map(record => record.type);
    const { records: countDocuments, errors: documentsErrors } = yield call(
      api.documents.getCountDocumentsByTypes,
      payload,
      dynamicTypeKeys
    );

    if (documentsErrors.length) {
      throw new Error(documentsErrors.join(' '));
    }

    yield put(
      setDynamicTypes({
        key: payload,
        dynamicTypes: DocumentsConverter.getDynamicTypes(dynamicTypes, typesNames, countDocuments)
      })
    );

    const types = yield select(state => selectAvailableTypes(state, payload));

    yield put(
      setAvailableTypes({
        key: payload,
        types: DocumentsConverter.getAvailableTypes(types, dynamicTypeKeys)
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
    const { records, errors } = yield call(api.documents.getDocumentsByType, payload.record, payload.type);

    if (errors.length) {
      throw new Error(errors.join(' '));
    }

    const typesNames = yield select(state => selectTypeNames(state, payload.record));

    yield put(
      setDocuments({
        key: payload.record,
        documents: DocumentsConverter.getDocuments({
          documents: records,
          type: payload.type,
          typeName: typesNames[payload.type]
        })
      })
    );

    const dynamicTypes = yield select(state => selectDynamicTypes(state, payload.record));

    if (dynamicTypes.length) {
      const type = dynamicTypes.find(item => item.type === payload.type);

      set(type, 'countDocuments', records.length);
    }

    yield put(setDynamicTypes({ key: payload.record, dynamicTypes }));
  } catch (e) {
    logger.error('[documents sagaGetDocumentsByType saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInitWidget, ea);
  yield takeEvery(getAvailableTypes().type, sagaGetAvailableTypes, ea);
  yield takeEvery(getDocumentsByType().type, sagaGetDocumentsByType, ea);
}

export default saga;
