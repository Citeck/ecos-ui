import { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';

import { reloadPageData, setPageData } from '../actions/webPage';

function* sagaReloadPageData({ api, logger }, action) {
  try {
    console.warn(action.payload.data);

    yield delay(500);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    logger.error('[comments sagaReloadPageData saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(reloadPageData().type, sagaReloadPageData, ea);
}

export default saga;
