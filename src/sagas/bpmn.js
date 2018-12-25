import { put, takeLatest, call } from 'redux-saga/effects';
import { initRequest, setCategories, setModels, setIsReady, saveCategory, setCategoryData } from '../actions/bpmn';

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

function* doSaveCategoryRequest({ api, fakeApi, logger }, action) {
  try {
    // TODO save category use api
    // const category = yield call(fakeApi.saveCategory);
    yield put(
      setCategoryData({
        id: action.payload.id,
        label: action.payload.label
      })
    );
  } catch (e) {
    logger.error('[bpmn doSaveCategoryRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initRequest().type, doInitRequest, ea);
  yield takeLatest(saveCategory().type, doSaveCategoryRequest, ea);
}

export default saga;
