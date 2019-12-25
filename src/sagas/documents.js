import { put, select, takeEvery } from 'redux-saga/effects';

import { getDocumentTypes } from '../actions/documents';

function* sagaGetDocumentTypes({ api, logger }, { payload }) {
  try {
  } catch (e) {
    logger.error('[documents sagaGetDocumentTypes saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getDocumentTypes().type, sagaGetDocumentTypes, ea);
}

export default saga;
