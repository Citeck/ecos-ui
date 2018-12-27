import { delay } from 'redux-saga';
import { select, put, takeLatest, call } from 'redux-saga/effects';
import {
  initRequest,
  setCategories,
  setModels,
  setIsReady,
  saveCategoryRequest,
  setCategoryData,
  deleteCategoryRequest,
  deleteCategory
} from '../actions/bpmn';
import { showModal } from '../actions/modal';
import { selectAllCategories, selectAllModels } from '../selectors/bpmn';

function* doInitRequest({ api, fakeApi, logger }) {
  try {
    const categories = yield call(api.bpmn.fetchCategories);
    const models2 = yield call(api.bpmn.fetchProcessModels);
    console.log('models2', models2);

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

function* doDeleteCategoryRequest({ api, fakeApi, logger }, action) {
  try {
    const categoryId = action.payload;

    const allCategories = yield select(selectAllCategories);
    const allModels = yield select(selectAllModels);

    const isCategoryHasChildren =
      allCategories.findIndex(item => item.parentId === categoryId) !== -1 ||
      allModels.findIndex(item => item.categoryId === categoryId) !== -1;

    if (isCategoryHasChildren) {
      yield delay(100);
      yield put(
        showModal({
          // TODO translation messages
          title: 'Ошибка удаления категории',
          content: 'Категория не пуста',
          buttons: [
            {
              label: 'OK',
              isCloseButton: true
            }
          ]
        })
      );
      return;
    }

    yield call(api.bpmn.deleteCategory, categoryId);
    yield put(deleteCategory(categoryId));
  } catch (e) {
    logger.error('[bpmn doDeleteCategoryRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initRequest().type, doInitRequest, ea);
  yield takeLatest(saveCategoryRequest().type, doSaveCategoryRequest, ea);
  yield takeLatest(deleteCategoryRequest().type, doDeleteCategoryRequest, ea);
}

export default saga;
