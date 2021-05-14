import { all, call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import * as queryString from 'query-string';
import { NotificationManager } from 'react-notifications';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
  initDocLib,
  setIsDocLibEnabled,
  setTypeRef,
  setFileTypeRefs,
  setDirTypeRef,
  setCreateVariants,
  createNode,
  setRootId,
  setFolderId,
  setFolderTitle,
  setFolderPath,
  initSidebar,
  setSidebarItems,
  addSidebarItems,
  setSidebarIsReady,
  setSidebarError,
  openFolder,
  unfoldSidebarItem,
  foldSidebarItem,
  updateSidebarItem,
  loadFolderData,
  loadFilesViewerData,
  setFileViewerIsReady,
  setFileViewerError,
  setFileViewerItems,
  setFileViewerTotal,
  setFileViewerSelected,
  setFileViewerPagination,
  setFileViewerLastClicked,
  setSearchText,
  startSearch,
  setIsGroupActionsReady,
  setGroupActions,
  execGroupAction,
  uploadFiles,
  setFileViewerLoadingStatus,
  setCanUploadFiles
} from '../actions/docLib';
import {
  selectDocLibSidebar,
  selectDocLibRootId,
  selectDocLibTypeRef,
  selectDocLibFolderId,
  selectDocLibFileViewerPagination,
  selectDocLibSearchText,
  selectDocLibFileViewer,
  selectDocLibCreateVariants,
  selectDocLibFolderTitle,
  selectDocLibFileCanUploadFiles
} from '../selectors/docLib';
import { JournalUrlParams } from '../constants';
import { NODE_TYPES, DEFAULT_DOCLIB_PAGINATION } from '../constants/docLib';
import { selectJournalData, selectUrl } from '../selectors/journals';
import { ActionTypes } from '../components/Records/actions';
import { t } from '../helpers/export/util';
import { getSearchParams, getUrlWithoutOrigin, goToCardDetailsPage } from '../helpers/urls';
import { wrapSaga } from '../helpers/redux';
import PageService from '../services/PageService';
import DocLibService from '../components/Journals/DocLib/DocLibService';
import JournalsService from '../components/Journals/service/journalsService';
import DocLibConverter from '../dto/docLib';
import JournalsConverter from '../dto/journals';
import { uploadFile } from './documents';

export function* loadDocumentLibrarySettings(journalId, w) {
  const typeRef = yield call(DocLibService.getTypeRef, journalId);
  if (!typeRef) {
    yield put(setIsDocLibEnabled(w(false)));
    return;
  }

  yield put(setTypeRef(w(typeRef)));

  const isDocumentLibraryEnabled = yield call(DocLibService.isDocLibEnabled, typeRef);
  yield put(setIsDocLibEnabled(w(!!isDocumentLibraryEnabled)));

  const fileTypeRefs = yield call(DocLibService.getFileTypeRefs, typeRef);
  yield put(setFileTypeRefs(w(fileTypeRefs)));

  const dirTypeRef = yield call(DocLibService.getDirTypeRef, typeRef);
  yield put(setDirTypeRef(w(dirTypeRef)));

  const createVariants = yield call(DocLibService.getCreateVariants, dirTypeRef, fileTypeRefs);
  yield put(setCreateVariants(w(createVariants)));

  const createVariant = (createVariants || []).find(item => item.nodeType === NODE_TYPES.FILE);

  if (!isEmpty(createVariant)) {
    const formDefinition = yield DocLibService.getCreateFormDefinition(createVariant);

    yield put(setCanUploadFiles(w(formKeysCheck(formDefinition))));
  }

  const rootId = yield call(DocLibService.getRootId, typeRef);
  yield put(setRootId(w(rootId)));

  yield put(initDocLib(w()));
}

export function* sagaInitDocumentLibrary({ logger, stateId, w }) {
  try {
    yield put(initSidebar(w()));

    // set selected item from url
    let selectedItemId = yield select(state => selectDocLibRootId(state, stateId));
    const url = yield select(selectUrl, stateId);
    if (url[JournalUrlParams.DOCLIB_FOLDER_ID]) {
      selectedItemId = url[JournalUrlParams.DOCLIB_FOLDER_ID];
    }

    if (url[JournalUrlParams.DOCLIB_SEARCH]) {
      yield put(setSearchText(w(url[JournalUrlParams.DOCLIB_SEARCH])));
    }

    yield put(setFolderId(w(selectedItemId)));
    yield put(loadFolderData(w()));
  } catch (e) {
    logger.error('[docLib sagaInitDocumentLibrary saga error', e.message);
  }
}

export function* sagaInitDocumentLibrarySidebar({ logger, stateId, w }) {
  try {
    yield put(setSidebarError(w(false)));
    yield put(setSidebarIsReady(w(false)));

    const rootId = yield select(state => selectDocLibRootId(state, stateId));
    const typeRef = yield select(state => selectDocLibTypeRef(state, stateId));

    const rootFolderTitle = yield call(DocLibService.getFolderTitle, rootId);
    const rootItem = { id: rootId, title: rootFolderTitle, parent: null, hasChildren: true };
    let sidebarItems = [rootItem];

    // load children for persisted items
    const unfoldedItemsId = yield call([DocLibService, 'loadUnfoldedFolders'], typeRef);
    const getChildrenCalls = unfoldedItemsId.map(id => call(DocLibService.getChildrenDirs, id));
    const loadedChildren = yield all(getChildrenCalls);
    loadedChildren.forEach((children, key) => {
      const currentChildren = DocLibConverter.prepareFolderTreeItems(children, unfoldedItemsId[key]);
      sidebarItems.push(...currentChildren);
    });
    sidebarItems = sidebarItems.map(item => {
      if (unfoldedItemsId.includes(item.id)) {
        return { ...item, isChildrenLoaded: true, isUnfolded: true };
      }
      return item;
    });
    yield put(setSidebarItems(w(sidebarItems)));

    // remove not found items from localStorage
    const removeIds = [];
    unfoldedItemsId.forEach(itemId => {
      if (sidebarItems.findIndex(item => item.id === itemId) === -1) {
        removeIds.push(call([DocLibService, 'removeUnfoldedItem'], typeRef, itemId));
      }
    });
    yield all(removeIds);

    yield put(setSidebarIsReady(w(true)));
  } catch (e) {
    yield put(setSidebarError(w(true)));
    yield put(setSidebarIsReady(w(true)));
    logger.error('[docLib sagaInitDocumentLibrarySidebar saga error', e.message);
  }
}

function* sagaUnfoldDocumentLibrarySidebarItem({ api, logger, stateId, w }, action) {
  const typeRef = yield select(state => selectDocLibTypeRef(state, stateId));
  const sidebar = yield select(state => selectDocLibSidebar(state, stateId));
  const items = sidebar.items;
  const currentItemId = action.payload;
  const currentItem = items.find(i => i.id === currentItemId);
  if (!currentItem) {
    return;
  }

  try {
    if (currentItem.isChildrenLoaded) {
      yield call([DocLibService, 'addUnfoldedItem'], typeRef, currentItemId);
    } else {
      yield put(updateSidebarItem(w({ ...currentItem, isChildrenLoading: true })));

      const loadedChildren = yield call(DocLibService.getChildrenDirs, currentItemId);
      const children = DocLibConverter.prepareFolderTreeItems(loadedChildren, currentItemId);

      yield put(addSidebarItems(w(children)));
      yield put(updateSidebarItem(w({ ...currentItem, isChildrenLoading: false, isChildrenLoaded: children.length > 0 })));

      yield call([DocLibService, 'addUnfoldedItem'], typeRef, currentItemId);
    }
  } catch (e) {
    yield put(updateSidebarItem(w({ ...currentItem, isChildrenLoading: false, isUnfolded: false })));

    yield call([NotificationManager, 'error'], t('document-library.sidebar.failure-to-load-children'));

    logger.error('[docLib sagaUnfoldDocumentLibrarySidebarItem saga error', e.message);
  }
}

function* sagaFoldDocumentLibrarySidebarItem({ api, logger, stateId, w }, action) {
  try {
    const typeRef = yield select(state => selectDocLibTypeRef(state, stateId));
    const currentItemId = action.payload;
    yield call([DocLibService, 'removeUnfoldedItem'], typeRef, currentItemId);
  } catch (e) {
    logger.error('[docLib sagaFoldDocumentLibrarySidebarItem saga error', e.message);
  }
}

function* sagaOpenFolder({ api, logger, stateId, w }, action) {
  try {
    const folderId = action.payload;
    const currentFolderId = yield select(state => selectDocLibFolderId(state, stateId));
    if (folderId === currentFolderId) {
      return;
    }

    // @todo move to sagaResetFileViewer?
    yield put(setFileViewerTotal(w(0)));
    yield put(setFileViewerSelected(w([])));
    yield put(setFileViewerLastClicked(w(null)));
    yield put(setFileViewerPagination(w(DEFAULT_DOCLIB_PAGINATION)));
    yield put(setSearchText(w('')));

    yield put(setFolderId(w(folderId)));
    yield put(loadFolderData(w()));

    const sidebar = yield select(state => selectDocLibSidebar(state, stateId));
    const items = sidebar.items;
    const currentItem = items.find(item => item.id === folderId);
    if (currentItem && currentItem.hasChildren && !currentItem.isUnfolded) {
      yield put(unfoldSidebarItem(w(folderId)));
    }

    const rootId = yield select(state => selectDocLibRootId(state, stateId));
    const query = getSearchParams();
    query[JournalUrlParams.DOCLIB_FOLDER_ID] = folderId === rootId ? undefined : folderId;
    query[JournalUrlParams.DOCLIB_SEARCH] = undefined;
    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });
    yield call(PageService.changeUrlLink, url, { updateUrl: true });
  } catch (e) {
    logger.error('[docLib sagaOpenFolder saga error', e.message);
  }
}

function* sagaDocLibLoadFolderData({ api, logger, stateId, w }) {
  try {
    const folderId = yield select(state => selectDocLibFolderId(state, stateId));

    yield put(loadFilesViewerData(w()));

    const folderTitle = yield call(DocLibService.getFolderTitle, folderId);
    yield put(setFolderTitle(w(folderTitle)));

    const folderPath = yield call(DocLibService.getDirPath, folderId);
    yield put(setFolderPath(w(folderPath)));
  } catch (e) {
    yield put(setFileViewerError(w(true)));
    logger.error('[docLib sagaDocLibLoadFolderData saga error', e.message);
  }
}

function* sagaLoadFilesViewerData({ api, logger, stateId, w }) {
  try {
    yield put(setFileViewerError(w(false)));
    yield put(setFileViewerIsReady(w(false)));

    yield* getFilesViewerData({ api, logger, stateId, w });

    yield put(setFileViewerIsReady(w(true)));
  } catch (e) {
    yield put(setFileViewerError(w(true)));
    logger.error('[docLib sagaLoadFilesViewerData saga error', e.message);
  }
}

function* getFilesViewerData({ api, logger, stateId, w }) {
  try {
    const folderId = yield select(state => selectDocLibFolderId(state, stateId));
    const pagination = yield select(state => selectDocLibFileViewerPagination(state, stateId));
    const searchText = yield select(state => selectDocLibSearchText(state, stateId));

    const childrenResult = yield call(DocLibService.getChildren, folderId, { pagination, searchText });
    const { records, totalCount } = childrenResult;

    yield put(setFileViewerTotal(w(totalCount)));

    const { journalConfig } = yield select(selectJournalData, stateId);
    const recordRefs = records.map(r => r.id);
    const resultActions = yield call([JournalsService, JournalsService.getRecordActions], journalConfig, recordRefs);
    const actions = JournalsConverter.getJournalActions(resultActions);

    yield put(setFileViewerItems(w(DocLibConverter.prepareFileListItems(records, actions.forRecord))));
  } catch (e) {
    logger.error('[docLib getFilesViewerData error', e.message);
  }
}

function* sagaDocLibStartSearch({ api, logger, stateId, w }, action) {
  try {
    const searchText = action.payload;
    yield put(setSearchText(w(searchText)));

    const query = getSearchParams();
    query[JournalUrlParams.DOCLIB_SEARCH] = searchText.length ? searchText : undefined;
    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });
    yield call(PageService.changeUrlLink, url, { updateUrl: true });

    const pagination = yield select(state => selectDocLibFileViewerPagination(state, stateId));
    yield put(
      setFileViewerPagination(
        w({
          ...DEFAULT_DOCLIB_PAGINATION,
          maxItems: pagination.maxItems
        })
      )
    );

    yield put(setFileViewerTotal(w(0)));
    yield put(setFileViewerSelected(w([])));
    yield put(setFileViewerLastClicked(w(null)));

    yield put(loadFilesViewerData(w()));
  } catch (e) {
    logger.error('[docLib sagaDocLibStartSearch saga error', e.message);
  }
}

export function* sagaInitGroupActions({ api, logger, stateId, w, skipDelay = false }, action) {
  try {
    const selected = action.payload;
    if (!Array.isArray(selected) || selected.length < 2) {
      yield put(setGroupActions(w({})));
      yield put(setIsGroupActionsReady(w(true)));
      return;
    }

    yield put(setIsGroupActionsReady(w(false)));

    if (!skipDelay) {
      yield delay(1000);
    }

    const { journalConfig } = yield select(selectJournalData, stateId);
    const resultActions = yield call([JournalsService, JournalsService.getRecordActions], journalConfig, selected);
    const actions = JournalsConverter.getJournalActions(resultActions);

    yield put(setGroupActions(w(actions)));
    yield put(setIsGroupActionsReady(w(true)));
  } catch (e) {
    yield put(setGroupActions(w({})));
    yield put(setIsGroupActionsReady(w(true)));
    logger.error('[docLib sagaInitGroupActions saga error', e.message);
  }
}

export function* sagaExecGroupAction({ api, logger, stateId, w }, action) {
  try {
    const fileViewer = yield select(state => selectDocLibFileViewer(state, stateId));
    const records = fileViewer.selected || [];

    const actionResult = yield call(api.recordActions.executeAction, { action: action.payload, records });
    const check = Array.isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;

    if (check) {
      if (get(action, 'payload.action.type', '') !== ActionTypes.BACKGROUND_VIEW) {
        yield put(loadFilesViewerData(w()));
      }
      // @todo reload sidebar - yield put(initSidebar(w()));
    }
  } catch (e) {
    logger.error('[docLib sagaExecGroupAction saga error', e.message);
  }
}

export function* sagaCreateNode({ api, logger, stateId, w }, action) {
  try {
    const { createVariant, submission } = action.payload;

    const rootId = yield select(state => selectDocLibRootId(state, stateId));
    const currentFolderId = yield select(state => selectDocLibFolderId(state, stateId));
    const typeRef = createVariant.destination;

    const createChildResult = yield call(DocLibService.createChild, rootId, currentFolderId, typeRef, submission);

    console.warn('by form => ', { submission });

    const newRecord = yield call(DocLibService.loadNode, createChildResult.id);

    if (createVariant.nodeType === NODE_TYPES.DIR) {
      yield put(openFolder(w(newRecord.id)));

      // update sidebar (unfold current folder, add new folder)
      const newChildren = DocLibConverter.prepareFolderTreeItems([newRecord], currentFolderId);
      yield put(addSidebarItems(w([...newChildren, { id: currentFolderId, hasChildren: true }])));
      yield put(unfoldSidebarItem(w(currentFolderId)));
    } else {
      yield call(goToCardDetailsPage, newRecord.id);
    }
  } catch (e) {
    logger.error('[docLib sagaCreateNode saga error', e.message);
  }
}

function formKeysCheck(formDefinition) {
  return get(formDefinition, 'components', [])
    .filter(item => item.key)
    .reduce((res, item) => {
      res.push(['_disp', '_content'].includes(item.key));

      return res;
    }, [])
    .every(i => i === true);
}

function* sagaUploadFiles({ api, logger, stateId, w }, action) {
  try {
    yield put(setFileViewerLoadingStatus(w(true)));

    const item = get(action, 'payload.item');
    const rootId = yield select(state => selectDocLibRootId(state, stateId));
    const createVariants = yield select(state => selectDocLibCreateVariants(state, stateId));
    const createVariant = (createVariants || []).find(item => item.nodeType === NODE_TYPES.FILE);
    const canUpload = yield select(state => selectDocLibFileCanUploadFiles(state, stateId));
    let folderId = yield select(state => selectDocLibFolderId(state, stateId));
    let folderTitle = yield select(state => selectDocLibFolderTitle(state, stateId));

    if (!canUpload) {
      NotificationManager.error(t('document-library.uploading-file.message.abort'));
      return;
    }

    if (item.type === NODE_TYPES.DIR) {
      folderId = item.id;
      folderTitle = yield call(DocLibService.getFolderTitle, folderId);
    }

    yield action.payload.files.map(function*(file) {
      try {
        const uploadedFile = yield uploadFile({ api, file });
        const createChildResult = yield call(
          DocLibService.createChild,
          rootId,
          folderId,
          get(createVariant, 'destination'),
          DocLibConverter.prepareUploadedFileDataForSaving(file, uploadedFile)
        );
        const fileName = yield createChildResult.load('');

        yield call(DocLibService.loadNode, createChildResult.id);

        NotificationManager.success(
          t('document-library.uploading-file.message.success', {
            file: fileName || uploadedFile.name,
            folder: folderTitle
          }),
          t('success')
        );
      } catch (e) {
        NotificationManager.error(
          t('document-library.uploading-file.message.error', {
            file: file.name
          }),
          t('error')
        );
        logger.error('[docLib uploadFile error', e.message);
      }
    });

    yield* getFilesViewerData({ api, logger, stateId, w });
  } catch (e) {
    logger.error('[docLib sagaUploadFiles saga error', e.message);
  } finally {
    yield put(setFileViewerLoadingStatus(w(false)));
  }
}

function* saga(ea) {
  yield takeEvery(initDocLib().type, wrapSaga, { ...ea, saga: sagaInitDocumentLibrary });
  yield takeEvery(initSidebar().type, wrapSaga, { ...ea, saga: sagaInitDocumentLibrarySidebar });
  yield takeEvery(unfoldSidebarItem().type, wrapSaga, { ...ea, saga: sagaUnfoldDocumentLibrarySidebarItem });
  yield takeEvery(foldSidebarItem().type, wrapSaga, { ...ea, saga: sagaFoldDocumentLibrarySidebarItem });
  yield takeEvery(openFolder().type, wrapSaga, { ...ea, saga: sagaOpenFolder });
  yield takeEvery(loadFolderData().type, wrapSaga, { ...ea, saga: sagaDocLibLoadFolderData });
  yield takeEvery(loadFilesViewerData().type, wrapSaga, { ...ea, saga: sagaLoadFilesViewerData });
  yield takeEvery(startSearch().type, wrapSaga, { ...ea, saga: sagaDocLibStartSearch });
  yield takeLatest(setFileViewerSelected().type, wrapSaga, { ...ea, saga: sagaInitGroupActions });
  yield takeLatest(execGroupAction().type, wrapSaga, { ...ea, saga: sagaExecGroupAction });
  yield takeLatest(createNode().type, wrapSaga, { ...ea, saga: sagaCreateNode });
  yield takeEvery(uploadFiles().type, wrapSaga, { ...ea, saga: sagaUploadFiles });
}

export default saga;
