import { put, takeLatest, call } from 'redux-saga/effects';
import { initRequest, setCategories, setModels, setIsReady } from '../actions/bpmn';

function* doInitRequest({ api, fakeApi, logger }) {
  try {
    const categories = yield call(fakeApi.getBpmnCategories);
    const models = yield call(fakeApi.getBpmnModels);
    yield put(setCategories(categories));
    yield put(setModels(models));
    yield put(setIsReady(true));
  } catch (e) {
    logger.error('[bpmn doInitRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initRequest().type, doInitRequest, ea);
}

export default saga;
