import { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';

import { changePageData, initPage, reloadPageData, setPageData } from '../actions/webPage';

function* sagaReloadPageData({ api }, action) {
  try {
    yield delay(150);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    console.error('[webPage sagaReloadPageData saga error', e);
  }
}

function* sagaInitPage({ api }, action) {
  try {
    yield delay(300);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    console.error('[webPage sagaInitPage saga error', e);
  }
}

function* saga(ea) {
  yield takeEvery([reloadPageData().type, changePageData().type], sagaReloadPageData, ea);
  yield takeEvery(initPage().type, sagaInitPage, ea);
}

export default saga;
