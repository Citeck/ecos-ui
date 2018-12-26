import { select, put, takeLatest, call } from 'redux-saga/effects';
import { initRequest, setCategories, setModels, setIsReady, saveCategory, setCategoryData } from '../actions/bpmn';
import { selectAllCategories } from '../selectors/bpmn';

function* doInitRequest({ api, fakeApi, logger }) {
  try {
    const categories = yield call(api.bpmn.fetchCategories);
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
    const categories = yield select(selectAllCategories);
    const currentCategory = categories.find(item => item.id === action.payload.id);

    let newId = null;
    if (currentCategory.isTemporary) {
      // create
      const categoryData = yield call(api.bpmn.createCategory, action.payload.label, currentCategory.parentId);
      newId = categoryData.id;
    } else {
      // update
      yield call(api.bpmn.updateCategory, action.payload.id, {
        title: action.payload.label
      });
    }

    yield put(
      setCategoryData({
        id: action.payload.id,
        label: action.payload.label,
        newId
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
