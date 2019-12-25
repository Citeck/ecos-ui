import { put, select, takeEvery, call } from 'redux-saga/effects';

import { init, getDocumentTypes, setDocumentTypes } from '../actions/documents';

function* sagaGetDocumentTypes({ api, logger }, { payload }) {
  try {
    const { records, errors } = yield call(api.documents.getDocumentTypes, payload);

    if (errors.length) {
      throw new Error(errors);
    }

    yield put(setDocumentTypes({ key: payload, types: records }));
    console.warn(payload, records);
  } catch (e) {
    logger.error('[documents sagaGetDocumentTypes saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery([getDocumentTypes().type, init().type], sagaGetDocumentTypes, ea);
}

export default saga;
