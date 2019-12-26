import { put, select, takeEvery, call } from 'redux-saga/effects';

import { selectTypeNames } from '../selectors/documents';
import { init, getAvailableTypes, setAvailableTypes, setDynamicTypes, setDocuments } from '../actions/documents';
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
      throw new Error(dtErrors);
    }

    const typesNames = yield select(state => selectTypeNames(state, payload));
    const dynamicTypeKeys = dynamicTypes.map(record => record.type);
    const { records: documents, errors: documentsErrors } = yield call(api.documents.getDocumentsByTypes, payload, dynamicTypeKeys);

    if (documentsErrors.length) {
      throw new Error(documentsErrors);
    }

    yield put(
      setDynamicTypes({
        key: payload,
        dynamicTypes: DocumentsConverter.getDynamicTypes(dynamicTypes, typesNames)
      })
    );
    yield put(
      setDocuments({
        key: payload,
        documents: DocumentsConverter.getDocuments(documents, dynamicTypeKeys)
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
      throw new Error(errors);
    }

    yield put(setAvailableTypes({ key: payload, types: records }));
  } catch (e) {
    logger.error('[documents sagaGetAvailableTypes saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(init().type, sagaInitWidget, ea);
  yield takeEvery(getAvailableTypes().type, sagaGetAvailableTypes, ea);
}

export default saga;
