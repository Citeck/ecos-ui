import React from 'react';
import { delay } from 'redux-saga';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import queryString from 'query-string';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';

import { URL } from '../constants';
import { EDITOR_PAGE_CONTEXT, SectionTypes } from '../constants/bpmn';
import { t } from '../helpers/util';
import PageService from '../services/PageService';
import ModelCreationForm from '../components/BPMNDesigner/ModelCreationForm';
import ImportModelForm from '../components/BPMNDesigner/ImportModelForm';
import {
  deleteCategory,
  deleteCategoryRequest,
  fetchSectionList,
  importProcessModelRequest,
  initRequest,
  saveCategoryRequest,
  savePagePosition,
  saveProcessModelRequest,
  setActiveSection,
  setCategories,
  setCategoryCollapseState,
  setCategoryData,
  setIsReady,
  setModels,
  setSectionList,
  setViewType,
  showImportModelForm,
  showModelCreationForm
} from '../actions/bpmn';
import { showModal } from '../actions/modal';
import { selectAllCategories, selectAllModels } from '../selectors/bpmn';
import { getPagePositionState, removePagePositionState, savePagePositionState } from '../helpers/bpmn';
import { BPMNDesignerService } from '../services/BPMNDesignerService';

function* doInitRequest({ api, logger }) {
  try {
    const categories = yield call(api.bpmn.fetchCategories);
    const models = yield call(api.bpmn.fetchProcessModels);

    yield put(fetchSectionList());
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
    logger.error('[bpmn doSaveCategoryRequest saga] error', e.message);
  }
}

function* doDeleteCategoryRequest({ api, logger }, action) {
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

function* doFetchSectionList({ api, logger }, action) {
  try {
    const localList = BPMNDesignerService.getMenuItems();
    const remoteList = yield call(api.bpmn.getSystemJournals);
    const query = queryString.parseUrl(window.location.href).query;

    yield put(setSectionList([...localList, ...remoteList]));

    if (isEmpty(query)) {
      yield put(setActiveSection(localList.find(i => i.type === SectionTypes.BPM) || localList[0] || remoteList[0]));
    } else {
      yield put(setActiveSection(remoteList.find(item => item.journalId === query.journalId)));
    }
  } catch (e) {
    logger.error('[bpmn doFetchSectionList saga] error', e.message);
  }
}

function* openActiveSection({ api, logger }, action) {
  try {
    const item = cloneDeep(action.payload);
    const sectionList = yield select(state => state.bpmn.sectionList || []);

    let href = '';
    let options = { updateUrl: true, pushHistory: true };

    switch (item.type) {
      case SectionTypes.BPM: {
        href = item.href;
        break;
      }
      case SectionTypes.JOURNAL: {
        href = queryString.stringifyUrl({ url: URL.BPMN_DESIGNER, query: { journalId: item.journalId } });
        break;
      }
      case SectionTypes.DEV_TOOLS: {
        href = item.href;
        //todo
        // options = { openInBackground: true };
        break;
      }
      default: {
        console.warn('Unknown section');
        return;
      }
    }

    PageService.changeUrlLink(href, options);
    //
    // if (options.openInBackground) {
    //   yield put(setActiveSection(sectionList.find(i => i.type === SectionTypes.BPM)));
    // }
  } catch (e) {
    logger.error('[bpmn openActiveSection saga] error', e.message);
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
  yield takeLatest(fetchSectionList().type, doFetchSectionList, ea);
  yield takeLatest(setActiveSection().type, openActiveSection, ea);
}

export default saga;
