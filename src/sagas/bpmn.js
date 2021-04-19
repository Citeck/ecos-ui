import React from 'react';
import { delay } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import endsWith from 'lodash/endsWith';

import { EDITOR_PAGE_CONTEXT } from '../constants/bpmn';
import { t } from '../helpers/util';
import ModelCreationForm from '../components/BPMNDesigner/ModelCreationForm';
import ImportModelForm from '../components/BPMNDesigner/ImportModelForm';
import {
  deleteCategory,
  deleteCategoryRequest,
  importProcessModelRequest,
  initRequest,
  saveCategoryRequest,
  savePagePosition,
  saveProcessModelRequest,
  setCategories,
  setCategoryCollapseState,
  setCategoryData,
  setIsReady,
  setModels,
  setViewType,
  showImportModelForm,
  showModelCreationForm
} from '../actions/bpmn';
import { showModal } from '../actions/modal';
import { selectAllCategories, selectAllModels } from '../selectors/bpmn';
import { getPagePositionState, removePagePositionState, savePagePositionState } from '../helpers/bpmn';

function* doInitRequest({ api, logger }) {
  try {
    const categories = yield call(api.bpmn.fetchCategories);
    const models = yield call(api.bpmn.fetchProcessModels);

    yield put(setCategories(categories));
    yield put(setModels(models));

    let pagePosition = yield call(getPagePositionState);
    if (pagePosition) {
      yield call(removePagePositionState);

      // TODO: optimization
      if (pagePosition.openedCategories) {
        for (let categoryId of pagePosition.openedCategories) {
          yield put(setCategoryCollapseState({ id: categoryId, isOpen: true }));
        }
      }

      if (pagePosition.viewType) {
        yield put(setViewType(pagePosition.viewType));
      }
    }

    yield put(setIsReady(true));

    if (pagePosition && pagePosition.scrollTop) {
      document.body.scrollTo(0, pagePosition.scrollTop);
    }
  } catch (e) {
    logger.error('[bpmn doInitRequest saga] error', e.message);
  }
}

function* doSaveCategoryRequest({ api, logger }, action) {
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
    NotificationManager.error(t('bpmn-designer.add-category.failure-message'));
    logger.error('[bpmn doSaveCategoryRequest saga] error', e.message);
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
          title: t('bpmn-designer.delete-category-dialog.failure-title'),
          content: t('bpmn-designer.delete-category-dialog.failure-text'),
          buttons: [
            {
              label: t('bpmn-designer.delete-category-dialog.close-btn'),
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

function* doSaveProcessModelRequest({ api, logger }, action) {
  try {
    const model = yield call(api.bpmn.createProcessModel, action.payload);
    const recordId = model.id.replace('workspace://SpacesStore/', '');

    window.location.href = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;

    // yield delay(100);
    //
    // const models = yield call(api.bpmn.fetchProcessModels);
    // yield put(setModels(models));
  } catch (e) {
    logger.error('[bpmn doSaveProcessModelRequest saga] error', e.message);
  }
}

function* doImportProcessModelRequest({ api, logger }, action) {
  try {
    const model = yield call(api.bpmn.importProcessModel, action.payload);
    const recordId = model.id.replace('workspace://SpacesStore/', '');

    window.location.href = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;

    // yield delay(100);
    //
    // const models = yield call(api.bpmn.fetchProcessModels);
    // yield put(setModels(models));
  } catch (e) {
    logger.error('[bpmn doImportProcessModelRequest saga] error', e.message);
  }
}

function* doShowModelCreationForm({ api, logger }, action) {
  try {
    const allCategories = yield select(selectAllCategories);

    if (!allCategories.length) {
      yield put(
        showModal({
          title: t('bpmn-designer.create-bpm-dialog.failure-title'),
          content: t('bpmn-designer.create-bpm-dialog.failure-text'),
          buttons: [
            {
              label: t('bpmn-designer.create-bpm-dialog.close-btn'),
              isCloseButton: true
            }
          ]
        })
      );

      return;
    }

    yield put(
      showModal({
        title: t('bpmn-designer.create-bpm-dialog.title'),
        content: <ModelCreationForm categoryId={action.payload} />
      })
    );
  } catch (e) {
    logger.error('[bpmn doShowModelCreationForm saga] error', e.message);
  }
}

function* doShowImportModelForm({ api, logger }, action) {
  try {
    const allCategories = yield select(selectAllCategories);

    if (!allCategories.length) {
      yield put(
        showModal({
          title: t('bpmn-designer.import-bpm-dialog.failure-title'),
          content: t('bpmn-designer.import-bpm-dialog.failure-text'),
          buttons: [
            {
              label: t('bpmn-designer.import-bpm-dialog.close-btn'),
              isCloseButton: true
            }
          ]
        })
      );

      return;
    }

    yield put(
      showModal({
        title: t('bpmn-designer.import-bpm-dialog.title'),
        content: <ImportModelForm />
      })
    );
  } catch (e) {
    logger.error('[bpmn doShowImportModelForm saga] error', e.message);
  }
}

function* doSavePagePosition({ api, logger }, action) {
  try {
    const allCategories = yield select(selectAllCategories);
    const viewType = yield select(state => state.bpmn.viewType);

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

    typeof action.payload.callback === 'function' && action.payload.callback();
  } catch (e) {
    logger.error('[bpmn doShowImportModelForm saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initRequest().type, doInitRequest, ea);
  yield takeLatest(saveCategoryRequest().type, doSaveCategoryRequest, ea);
  yield takeLatest(deleteCategoryRequest().type, doDeleteCategoryRequest, ea);
  yield takeLatest(saveProcessModelRequest().type, doSaveProcessModelRequest, ea);
  yield takeLatest(importProcessModelRequest().type, doImportProcessModelRequest, ea);
  yield takeLatest(showModelCreationForm().type, doShowModelCreationForm, ea);
  yield takeLatest(showImportModelForm().type, doShowImportModelForm, ea);
  yield takeLatest(savePagePosition().type, doSavePagePosition, ea);
}

export default saga;
