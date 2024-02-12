import { delay } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import endsWith from 'lodash/endsWith';
import isFunction from 'lodash/isFunction';

import {
  updateModels,
  setCategoryData,
  saveCategoryRequest,
  deleteCategory,
  deleteCategoryRequest,
  savePagePosition,
  setViewType,
  setIsCategoryOpen,
  initRequest,
  setIsReady,
  setCategories,
  setModels,
  setCreateVariants,
  importProcessModelRequest,
  createModel
} from '../actions/dmn';
import { INFO_DIALOG_ID } from '../components/common/dialogs/Manager/DialogManager';
import { showModal } from '../actions/modal';
import { selectAllCategories, selectAllModels } from '../selectors/dmn';
import { getPagePositionState, savePagePositionState } from '../helpers/dmn';
import { EDITOR_PAGE_CONTEXT } from '../constants/dmn';
import Records from '../components/Records';
import FormManager from '../components/EcosForm/FormManager';
import { t } from '../helpers/util';

function* initDmn({ api, logger }) {
  try {
    const categories = yield call(api.dmn.fetchCategories);
    const models = yield call(api.dmn.fetchProcessModels);
    const createVariants = yield call(api.dmn.fetchCreateVariants);

    yield put(setCategories(categories));
    yield put(setModels(models));
    yield put(setCreateVariants(createVariants));

    const pagePosition = JSON.parse(yield call(getPagePositionState));
    if (pagePosition) {
      // TODO: optimization
      if (pagePosition.openedCategories) {
        for (const categoryId of pagePosition.openedCategories) {
          yield put(setIsCategoryOpen({ id: categoryId, isOpen: true }));
        }
      }

      if (pagePosition.viewType) {
        yield put(setViewType(pagePosition.viewType));
      }
    }

    yield put(setIsReady(true));
  } catch (e) {
    logger.error('[dmn initRequest saga] error', e);
  }
}

function* doCreateModel({ api, logger }, action) {
  try {
    const payload = action.payload || {};

    let cv = payload.createVariant;
    if (cv == null) {
      cv = yield Records.get('emodel/type@dmn-def').load('createVariantsById.create-new-process-def?json', true);
    }

    if (payload.categoryId) {
      cv.attributes = {
        ...(cv.attributes || {}),
        sectionRef: payload.categoryId
      };
    }

    const saved = yield new Promise(resolve => {
      FormManager.createRecordByVariant(cv, {
        onSubmit: () => resolve(true),
        onFormCancel: () => resolve(false)
      });
    });
    if (saved) {
      const models = yield call(api.dmn.fetchProcessModels);
      yield put(setModels(models));
    }
  } catch (e) {
    logger.error('[dmn doCreateModel saga] error', e);
  }
}

function* doSaveCategoryRequest({ api, logger }, action) {
  try {
    const categories = yield select(selectAllCategories);
    const currentCategory = categories.find(item => item.id === action.payload.id);

    let newId = null;

    let { canCreateDef, canCreateSubSection } = currentCategory;

    if (currentCategory.isTemporary) {
      const categoryData = yield call(api.dmn.createCategory, action.payload.code, action.payload.label, currentCategory.parentId);
      newId = categoryData.id;

      const parentCategory = categories.find(item => item.id === currentCategory.parentId);
      canCreateDef = categoryData.canCreateDef || parentCategory.canCreateDef;
      canCreateSubSection = categoryData.canCreateSubSection || parentCategory.canCreateSubSection;
    } else {
      yield call(api.dmn.updateCategory, action.payload.id, {
        title: action.payload.label,
        code: action.payload.code
      });
    }

    yield put(
      setCategoryData({
        id: action.payload.id,
        label: action.payload.label,
        code: action.payload.code,
        canCreateDef,
        canCreateSubSection,
        newId
      })
    );
  } catch (e) {
    NotificationManager.error(t('designer.add-category.failure-message'));
    logger.error('[dmn doSaveCategoryRequest saga] error', e);
  }
}

function* doDeleteCategoryRequest({ api, logger }, action) {
  try {
    const categoryId = action.payload;

    const allCategories = yield select(selectAllCategories);
    const allModels = yield select(selectAllModels);

    const isCategoryHasChildren =
      allCategories.findIndex(item => endsWith(item.parentId, categoryId)) !== -1 ||
      allModels.findIndex(item => item.categoryId.includes(categoryId)) !== -1;

    if (isCategoryHasChildren) {
      yield delay(100);
      yield put(
        showModal({
          dialogId: INFO_DIALOG_ID,
          title: t('designer.delete-category-dialog.failure-title'),
          text: t('designer.delete-category-dialog.failure-text')
        })
      );
      return;
    }

    yield call(api.dmn.deleteCategory, categoryId);
    yield put(deleteCategory(categoryId));
  } catch (e) {
    logger.error('[dmn doDeleteCategoryRequest saga] error', e);
  }
}

function* doImportProcessModelRequest({ api, logger }, action) {
  try {
    const model = yield call(api.dmn.importProcessModel, action.payload);
    const recordId = model.id.replace('workspace://SpacesStore/', '');

    window.location.href = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;
  } catch (e) {
    logger.error('[dmn doImportProcessModelRequest saga] error', e);
  }
}

function* doSavePagePosition({ api, logger }, action) {
  try {
    const allCategories = yield select(selectAllCategories);
    const viewType = yield select(state => state.dmn.viewType);

    const openedCategories = [];
    allCategories.forEach(item => {
      if (item.isOpen) {
        openedCategories.push(item.id);
      }
    });

    yield call(savePagePositionState, {
      scrollTop: document.body.scrollTop,
      openedCategories,
      viewType
    });

    action.payload && isFunction(action.payload.callback) && action.payload.callback();
  } catch (e) {
    logger.error('[dmn doShowImportModelForm saga] error', e);
  }
}

function* doUpdateModels({ api, logger }) {
  try {
    const models = yield call(api.dmn.fetchProcessModels);
    yield put(setModels(models));
  } catch (e) {
    logger.console.error(('[dmn doUpdateModels saga] error', e));
  }
}

function* saga(ea) {
  yield takeLatest(initRequest().type, initDmn, ea);
  yield takeLatest(updateModels().type, doUpdateModels, ea);
  yield takeLatest(saveCategoryRequest().type, doSaveCategoryRequest, ea);
  yield takeLatest(createModel().type, doCreateModel, ea);
  yield takeLatest(deleteCategoryRequest().type, doDeleteCategoryRequest, ea);
  yield takeLatest(importProcessModelRequest().type, doImportProcessModelRequest, ea);
  yield takeLatest(savePagePosition().type, doSavePagePosition, ea);
}

export default saga;
