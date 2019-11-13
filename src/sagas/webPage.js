import { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';

import { reloadPageData, setPageData, initPage, changePageData } from '../actions/webPage';

function* sagaReloadPageData({ api, logger }, action) {
  try {
    yield delay(150);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    logger.error('[webPage sagaReloadPageData saga error', e.message);
  }
}

function* sagaInitPage({ api, logger }, action) {
  try {
    yield delay(300);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    logger.error('[webPage sagaInitPage saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery([reloadPageData().type, changePageData().type], sagaReloadPageData, ea);
  yield takeEvery(initPage().type, sagaInitPage, ea);
}

export default saga;
