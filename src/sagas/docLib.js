import { all, call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import * as queryString from 'query-string';
import { NotificationManager } from '@/services/notifications';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import initializeWorker from '../workers/docLib';
import { getStore } from '../store';

import {
  addSidebarItems,
  changeNode,
  createNode,
  execGroupAction,
  foldSidebarItem,
  getTypeRef,
  initDocLib,
  initSidebar,
  loadFilesViewerData,
  loadFolderData,
  openFolder,
  setCanUploadFiles,
  setCreateVariants,
  setDirTypeRef,
  setFileTypeRefs,
  setFileViewerError,
  setFileViewerIsReady,
  setFileViewerItems,
  setFileViewerLastClicked,
  setFileViewerLoadingStatus,
  setFileViewerPagination,
  setFileViewerSelected,
  setFileViewerTotal,
  setFolderId,
  setFolderPath,
  setFolderTitle,
  setGroupActions,
  setIsDocLibEnabled,
  setIsGroupActionsReady,
  setJournalId,
  setParentItem,
  setRootId,
  setSearchText,
  setSidebarError,
  setSidebarIsReady,
  setSidebarItems,
  setTypeRef,
  startSearch,
  unfoldSidebarItem,
  updateSidebarItem,
  uploadFiles,
} from '../actions/docLib';
import {
  selectDocLibCreateVariants,
  selectDocLibFileCanUploadFiles,
  selectDocLibFileViewer,
  selectDocLibFileViewerPagination,
  selectDocLibFolderId,
  selectDocLibFolderTitle,
  selectDocLibRootId,
  selectDocLibSearchText,
  selectDocLibSidebar,
  selectDocLibSidebarItems,
  selectDocLibTypeRef,
  selectJournalId,
} from '../selectors/docLib';
import { selectJournalData, selectUrl } from '../selectors/journals';
import { DocLibUrlParams } from '../constants';
import { DEFAULT_DOCLIB_PAGINATION, NODE_TYPES } from '../constants/docLib';
import { t } from '../helpers/export/util';
import { getSearchParams, getUrlWithoutOrigin, getWorkspaceId } from '../helpers/urls';
import { wrapSaga } from '../helpers/redux';
import PageService from '../services/PageService';
import { ActionTypes } from '../components/Records/actions/constants';
import DocLibService from '../components/Journals/DocLib/DocLibService';
import JournalsService from '../components/Journals/service/journalsService';
import DocLibConverter from '../dto/docLib';
import JournalsConverter from '../dto/journals';

const DOCLIB_INNER_DOC_ID_REGEX = /^emodel\/doclib@.+\$(.+)$/;

export function* sagaGetTypeRef({ stateId, w }, action) {
  try {
    const { journalId } = action.payload;
    const typeRef = yield call(DocLibService.getTypeRef, journalId);

    if (!typeRef) {
      yield put(setIsDocLibEnabled(w(false)));
      return;
    }

    yield put(setTypeRef(w(typeRef)));
    yield put(setJournalId(w(journalId)));

    const isDocumentLibraryEnabled = yield call(DocLibService.isDocLibEnabled, typeRef);
    yield put(setIsDocLibEnabled(w(!!isDocumentLibraryEnabled)));

    return { typeRef };
  } catch (e) {
    console.error('[docLib sagaGetTypeRef saga error', e);
  }
}

export function* loadDocumentLibrarySettings(typeRef, w) {
  if (!typeRef) {
    return;
  }

  const fileTypeRefs = yield call(DocLibService.getFileTypeRefs, typeRef);
  yield put(setFileTypeRefs(w(fileTypeRefs)));

  const dirTypeRef = yield call(DocLibService.getDirTypeRef, typeRef);
  yield put(setDirTypeRef(w(dirTypeRef)));

  const createVariants = yield call(DocLibService.getCreateVariants, dirTypeRef, fileTypeRefs);
  yield put(setCreateVariants(w(createVariants)));

  const createVariant = (createVariants || []).find((item) => item.nodeType === NODE_TYPES.FILE);

  if (!isEmpty(createVariant)) {
    const formDefinition = yield DocLibService.getCreateFormDefinition(createVariant);

    yield put(setCanUploadFiles(w(formKeysCheck(formDefinition))));
  }

  const rootId = yield call(DocLibService.getRootId, typeRef);
  yield put(setRootId(w(rootId)));

  return { rootId };
}

export function* sagaInitDocumentLibrary({ stateId, w }) {
  try {
    const typeRef = yield select((state) => selectDocLibTypeRef(state, stateId));
    let { rootId: selectedItemId } = yield call(loadDocumentLibrarySettings, typeRef, w);

    // set selected item from url
    const url = yield select(selectUrl, stateId);
    if (url[DocLibUrlParams.FOLDER_ID]) {
      selectedItemId = url[DocLibUrlParams.FOLDER_ID];
    }

    yield put(initSidebar(w()));

    if (url[DocLibUrlParams.SEARCH]) {
      yield put(setSearchText(w(url[DocLibUrlParams.SEARCH])));
    }

    yield put(setFolderId(w(selectedItemId)));
    yield put(loadFolderData(w()));
  } catch (e) {
    console.error('[docLib sagaInitDocumentLibrary saga error', e);
  }
}

export function* sagaInitDocumentLibrarySidebar({ stateId, w }) {
  try {
    yield put(setSidebarError(w(false)));
    yield put(setSidebarIsReady(w(false)));

    const rootId = yield select((state) => selectDocLibRootId(state, stateId));
    const typeRef = yield select((state) => selectDocLibTypeRef(state, stateId));

    const rootFolderTitle = yield call(DocLibService.getFolderTitle, rootId);
    const rootItem = { id: rootId, title: rootFolderTitle, parent: null, hasChildren: true };
    let sidebarItems = [rootItem];

    // load children for persisted items
    const unfoldedItemsId = yield call([DocLibService, 'loadUnfoldedFolders'], typeRef);
    const getChildrenCalls = unfoldedItemsId.map((id) => call(DocLibService.getChildrenDirs, id));
    const loadedChildren = yield all(getChildrenCalls);
    loadedChildren.forEach((children, key) => {
      const currentChildren = DocLibConverter.prepareFolderTreeItems(children, unfoldedItemsId[key]);
      sidebarItems.push(...currentChildren);
    });
    sidebarItems = sidebarItems.map((item) => {
      if (unfoldedItemsId.includes(item.id)) {
        return { ...item, isChildrenLoaded: true, isUnfolded: true };
      }
      return item;
    });
    yield put(setSidebarItems(w(sidebarItems)));

    // remove not found items from localStorage
    const removeIds = [];
    unfoldedItemsId.forEach((itemId) => {
      if (sidebarItems.findIndex((item) => item.id === itemId) === -1) {
        removeIds.push(call([DocLibService, 'removeUnfoldedItem'], typeRef, itemId));
      }
    });
    yield all(removeIds);

    yield put(setSidebarIsReady(w(true)));
  } catch (e) {
    yield put(setSidebarError(w(true)));
    yield put(setSidebarIsReady(w(true)));
    console.error('[docLib sagaInitDocumentLibrarySidebar saga error', e);
  }
}

function* sagaUnfoldDocumentLibrarySidebarItem({ api, stateId, w }, action) {
  const typeRef = yield select((state) => selectDocLibTypeRef(state, stateId));
  const sidebar = yield select((state) => selectDocLibSidebar(state, stateId));
  const items = sidebar.items;
  const currentItemId = action.payload;
  const currentItem = items.find((i) => i.id === currentItemId);
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

    console.error('[docLib sagaUnfoldDocumentLibrarySidebarItem saga error', e);
  }
}

function* sagaFoldDocumentLibrarySidebarItem({ api, stateId, w }, action) {
  try {
    const typeRef = yield select((state) => selectDocLibTypeRef(state, stateId));
    const currentItemId = action.payload;
    yield call([DocLibService, 'removeUnfoldedItem'], typeRef, currentItemId);
  } catch (e) {
    console.error('[docLib sagaFoldDocumentLibrarySidebarItem saga error', e);
  }
}

function* sagaOpenFolder({ api, stateId, w }, action) {
  try {
    const folderId = action.payload;
    const currentFolderId = yield select((state) => selectDocLibFolderId(state, stateId));
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

    const sidebar = yield select((state) => selectDocLibSidebar(state, stateId));
    const items = sidebar.items;
    const currentItem = items.find((item) => item.id === folderId);
    if (currentItem && currentItem.hasChildren && !currentItem.isUnfolded) {
      yield put(unfoldSidebarItem(w(folderId)));
    }

    const rootId = yield select((state) => selectDocLibRootId(state, stateId));
    const query = getSearchParams();
    query[DocLibUrlParams.FOLDER_ID] = folderId === rootId ? undefined : folderId;
    query[DocLibUrlParams.SEARCH] = undefined;
    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });
    yield call(PageService.changeUrlLink, url, { updateUrl: true });
  } catch (e) {
    console.error('[docLib sagaOpenFolder saga error', e);
  }
}

function* sagaDocLibLoadFolderData({ api, stateId, w }) {
  try {
    const folderId = yield select((state) => selectDocLibFolderId(state, stateId));

    yield put(loadFilesViewerData(w()));

    const folderTitle = yield call(DocLibService.getFolderTitle, folderId);
    yield put(setFolderTitle(w(folderTitle)));

    const folderPath = yield call(DocLibService.getDirPath, folderId);
    yield put(setFolderPath(w(folderPath)));
  } catch (e) {
    yield put(setFileViewerError(w(true)));
    console.error('[docLib sagaDocLibLoadFolderData saga error', e);
  }
}

function* sagaLoadFilesViewerData({ api, stateId, w }) {
  try {
    yield put(setFileViewerError(w(false)));
    yield put(setFileViewerIsReady(w(false)));

    yield* getFilesViewerData({ api, stateId, w });

    yield put(setFileViewerIsReady(w(true)));
  } catch (e) {
    yield put(setFileViewerError(w(true)));
    console.error('[docLib sagaLoadFilesViewerData saga error', e);
  }
}

function* getFilesViewerData({ api, stateId, w }) {
  try {
    const store = getStore();
    const folderId = yield select((state) => selectDocLibFolderId(state, stateId));
    const pagination = yield select((state) => selectDocLibFileViewerPagination(state, stateId));
    const searchText = yield select((state) => selectDocLibSearchText(state, stateId));
    const journalId = yield select((state) => selectJournalId(state, stateId));

    const docLibRef = journalId.includes('$') ? journalId.split('$')[1] : journalId;

    const childrenResult = yield call(DocLibService.getChildren, folderId, { pagination, searchText });
    const { records, totalCount } = childrenResult;

    yield put(setFileViewerTotal(w(totalCount)));
    const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], journalId);

    const recordRefs = records.map((r) => r.id);
    const dirActionsRefs = yield call(DocLibService.getDirActions, docLibRef);
    const dirActions = (dirActionsRefs || []).map((ref) => (ref && ref.includes('@') ? ref.split('@')[1] : ref));

    const resultActions = yield call([JournalsService, JournalsService.getRecordActions], journalConfig, recordRefs);
    const actions = JournalsConverter.getJournalActions(resultActions);

    let actionsForRecord = actions.forRecord;

    (records || []).forEach(({ nodeType, id }) => {
      if (nodeType === NODE_TYPES.DIR) {
        actionsForRecord[id] = (actionsForRecord[id] || []).filter((action) => dirActions.includes(action.id));
      }
    });

    const changeNodeFn = (params) => store.dispatch(changeNode({ ...params, stateId }));

    yield put(
      setFileViewerItems(
        w(
          DocLibConverter.prepareFileListItems(
            records,
            actions.forRecord,
            () => DocLibService.emitter.emit(DocLibService.actionSuccessCallback),
            { changeNode: changeNodeFn },
          ),
        ),
      ),
    );

    yield put(setFileViewerLoadingStatus(w(false)));
  } catch (e) {
    console.error('[docLib getFilesViewerData error', e);
  }
}

function* sagaDocLibStartSearch({ api, stateId, w }, action) {
  try {
    const searchText = action.payload;
    yield put(setSearchText(w(searchText)));

    const query = getSearchParams();
    query[DocLibUrlParams.SEARCH] = searchText.length ? searchText : undefined;
    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });
    yield call(PageService.changeUrlLink, url, { updateUrl: true });

    const pagination = yield select((state) => selectDocLibFileViewerPagination(state, stateId));
    yield put(
      setFileViewerPagination(
        w({
          ...DEFAULT_DOCLIB_PAGINATION,
          maxItems: pagination.maxItems,
        }),
      ),
    );

    yield put(setFileViewerTotal(w(0)));
    yield put(setFileViewerSelected(w([])));
    yield put(setFileViewerLastClicked(w(null)));

    yield put(loadFilesViewerData(w()));
  } catch (e) {
    console.error('[docLib sagaDocLibStartSearch saga error', e);
  }
}

export function* sagaInitGroupActions({ api, stateId, w, skipDelay = false }, action) {
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
    console.error('[docLib sagaInitGroupActions saga error', e);
  }
}

export function* sagaExecGroupAction({ api, stateId, w }, action) {
  try {
    const fileViewer = yield select((state) => selectDocLibFileViewer(state, stateId));
    const records = fileViewer.selected || [];

    const actionResult = yield call(api.recordActions.executeAction, { action: action.payload, records });
    const check = Array.isArray(actionResult) ? actionResult.some((res) => res !== false) : actionResult !== false;

    if (check) {
      if (get(action, 'payload.action.type', '') !== ActionTypes.BACKGROUND_VIEW) {
        yield put(loadFilesViewerData(w()));
      }
      // @todo reload sidebar - yield put(initSidebar(w()));
    }
  } catch (e) {
    console.error('[docLib sagaExecGroupAction saga error', e);
  }
}

function* checkUniqueNameNode({ api, stateId, w }, { submission, nodeType, isExistsItem, originName }) {
  try {
    if (!submission || !nodeType) {
      return;
    }

    let currentItemTitle;
    const nameItem = get(submission, 'name')?.trim() || get(submission, '_disp')?.trim();
    const originalNameItem = get(submission, '_content[0].originalName') || get(submission, '_content[0].name');

    if (nameItem && originalNameItem && nodeType === NODE_TYPES.FILE) {
      const format = originalNameItem.split('.').pop();
      currentItemTitle = nameItem + '.' + format;
    } else {
      currentItemTitle = originalNameItem || nameItem || '';
    }

    currentItemTitle = currentItemTitle.trim();

    if (!currentItemTitle) {
      NotificationManager.error(t('document-library.uploading-file.message.info.error'));
      return;
    }

    const parentDirTitles = [];
    const fileViewer = yield select((state) => selectDocLibFileViewer(state, stateId));
    const selectFolderTitle = yield select((state) => selectDocLibFolderTitle(state, stateId));
    const items = get(fileViewer, 'items') || [];

    items.forEach((item) => get(item, 'title') && parentDirTitles.push(item.title));
    if (isExistsItem && originName === currentItemTitle) {
      const indexExistsItem = parentDirTitles.indexOf(currentItemTitle);
      if (indexExistsItem !== -1) {
        parentDirTitles.splice(indexExistsItem, 1);
      }
    }

    const renamePromise = new Promise((resolve) => {
      if (currentItemTitle && parentDirTitles.includes(currentItemTitle)) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CONFIRMATION_RENAME_DIR_REQUEST',
            typeCurrentItem: nodeType,
            parentDirTitles,
            currentItemTitle,
            targetDirTitle: selectFolderTitle,
          });

          navigator.serviceWorker.onmessage = (event) => {
            const { type, confirmedRenameItem, titleRenamingItem } = event.data;

            if (type === 'CONFIRMATION_RENAME_DIR_RESPONSE' && confirmedRenameItem) {
              currentItemTitle = titleRenamingItem;
              resolve();
            }
          };
        }
      } else {
        resolve();
      }
    });

    yield call(() => renamePromise);

    return { currentItemTitle, parentDirTitles };
  } catch (e) {
    console.error('[docLib checkUniqueNameNode saga error', e);
  }
}

export function* sagaCreateNode({ api, stateId, w }, action) {
  try {
    const { createVariant, submission } = action.payload;

    const { currentItemTitle, parentDirTitles } = yield* checkUniqueNameNode(
      { api, stateId, w },
      {
        submission,
        nodeType: createVariant.nodeType,
      },
    );

    if (currentItemTitle && parentDirTitles.includes(currentItemTitle)) {
      return;
    }

    if (createVariant.nodeType === NODE_TYPES.FILE) {
      yield put(setFileViewerLoadingStatus(w(true)));
    }

    const rootId = yield select((state) => selectDocLibRootId(state, stateId));
    const currentFolderId = yield select((state) => selectDocLibFolderId(state, stateId));
    const typeRef = createVariant.typeRef;

    const createChildResult = yield call(DocLibService.createChild, rootId, currentFolderId, typeRef, submission, currentItemTitle);
    const newRecord = yield call(DocLibService.loadNode, createChildResult.id);

    if (createVariant.nodeType === NODE_TYPES.DIR) {
      yield put(openFolder(w(newRecord.id)));

      // update sidebar (unfold current folder, add new folder)
      const newChildren = DocLibConverter.prepareFolderTreeItems([newRecord], currentFolderId);
      yield put(addSidebarItems(w([...newChildren, { id: currentFolderId, hasChildren: true }])));
      yield put(unfoldSidebarItem(w(currentFolderId)));
    } else {
      if (createVariant.postActionRef) {
        const actionProps = yield call(api.recordActions.getActionProps, { action: createVariant.postActionRef });
        let recordId = createChildResult.id;
        const recordIdParts = DOCLIB_INNER_DOC_ID_REGEX.exec(createChildResult.id);
        if (recordIdParts) {
          recordId = recordIdParts[1];
        }
        yield call(api.recordActions.executeAction, { records: recordId, action: actionProps });
      }
      yield put(loadFilesViewerData(w()));
      // const localDobLibRecordRef = newRecord.id.substring(newRecord.id.indexOf('$') + 1);
      // yield call(goToCardDetailsPage, localDobLibRecordRef);
    }
  } catch (e) {
    console.error('[docLib sagaCreateNode saga error', e);
  }
}

export function* sagaChangeNode({ api, w }, action) {
  try {
    const { record, submission, nodeType, stateId } = action.payload;

    if (!(record && nodeType && stateId)) {
      return;
    }

    const originName = yield record.load('name?str');
    if (nodeType === NODE_TYPES.FILE && submission?.name) {
      submission.name = submission.name.replace(/\.[^.]+$/, '');
    }

    const { currentItemTitle, parentDirTitles } = yield* checkUniqueNameNode(
      { api, stateId, w },
      {
        submission,
        nodeType,
        originName,
        isExistsItem: true,
      },
    );
    if (currentItemTitle && parentDirTitles.includes(currentItemTitle)) {
      return;
    }

    record.att('name', currentItemTitle);
    if (get(submission, '_content')) {
      record.att('_content', submission._content);
    }

    yield record.save();

    if (nodeType === NODE_TYPES.DIR) {
      const sidebarItems = yield select((state) => selectDocLibSidebarItems(state, stateId));
      const newSidebarItems = [];

      const editDirId = yield record.load('?id');
      const newRecord = yield call(DocLibService.loadNode, editDirId);

      if (newRecord && newRecord.id) {
        (sidebarItems || []).forEach((item) => {
          const itemId = get(item, 'id', '');
          const substringItemId = itemId.substring(itemId.indexOf('$') + 1);

          if (substringItemId && substringItemId === newRecord.id) {
            newSidebarItems.push({
              ...item,
              ...newRecord,
            });
          } else {
            newSidebarItems.push(item);
          }
        });

        yield put(setSidebarItems(w(newSidebarItems)));
      }
    }

    yield put(loadFilesViewerData(w()));
  } catch (e) {
    console.error('[docLib sagaChangeNode saga error', e);
  }
}

function formKeysCheck(formDefinition) {
  const componentKeys = new Set();
  EcosFormUtils.forEachComponent(formDefinition, (component) => {
    if (component.input && component.type !== 'button') {
      componentKeys.add(component.key);
    }
  });
  return componentKeys.has('name') && componentKeys.has('_content') && componentKeys.size === 2;
}

function* sagaSetParentItem({ api, stateId, w }, { payload }) {
  try {
    const { item, parent } = payload;
    const { id: itemId, title: itemTitle } = item || {};

    const parentDirTitles = [];
    let currentItemTitle = itemTitle;

    const targetItem = yield call(DocLibService.loadNode, parent);
    if (get(targetItem, 'nodeType') === NODE_TYPES.FILE) {
      return;
    }

    const targetDirTitle = get(targetItem, 'title', '');

    const children = yield call(DocLibService.getChildren, parent);
    if (get(children, 'records') && children.records.length) {
      children.records.forEach((item) => {
        if (item && item.id && item.title) {
          parentDirTitles.push(item.title);
        }
      });
    }

    const renamePromise = new Promise((resolve) => {
      if (itemTitle && parentDirTitles.includes(itemTitle)) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CONFIRMATION_RENAME_DIR_REQUEST',
            typeCurrentItem: get(item, 'type'),
            isReplacementItem: true,
            parentDirTitles,
            currentItemTitle,
            targetDirTitle,
          });

          navigator.serviceWorker.onmessage = (event) => {
            const { type, confirmedRenameItem, titleRenamingItem } = event.data;

            if (type === 'CONFIRMATION_RENAME_DIR_RESPONSE' && confirmedRenameItem) {
              currentItemTitle = titleRenamingItem;
              resolve();
            }
          };
        }
      } else {
        resolve();
      }
    });

    yield call(() => renamePromise);

    if (itemId && currentItemTitle && !parentDirTitles.includes(currentItemTitle)) {
      yield call(DocLibService.changeParent, itemId, parent, currentItemTitle);

      NotificationManager.success(t('document-library.actions.replacement-item-success', { currentItemTitle, targetDirTitle }));

      yield put(initSidebar(w()));
      yield put(loadFilesViewerData(w()));
      yield put(loadFolderData(w()));
    }
  } catch (e) {
    console.error('[docLib sagaSetParentItem saga error', e);
  }
}

function* sagaUploadFiles({ api, stateId, w }, action) {
  try {
    yield put(setFileViewerLoadingStatus(w(true)));

    const item = get(action, 'payload.item', {});
    const rootId = yield select((state) => selectDocLibRootId(state, stateId));
    const createVariants = yield select((state) => selectDocLibCreateVariants(state, stateId));
    const createVariantFile = (createVariants || []).find((item) => item.nodeType === NODE_TYPES.FILE);
    const createVariantDir = (createVariants || []).find((item) => item.nodeType === NODE_TYPES.DIR);
    const canUpload = yield select((state) => selectDocLibFileCanUploadFiles(state, stateId));
    let folderId = yield select((state) => selectDocLibFolderId(state, stateId));
    let folderTitle = yield select((state) => selectDocLibFolderTitle(state, stateId));

    if (!canUpload) {
      NotificationManager.error(t('document-library.uploading-file.message.abort'));
      return;
    }

    let { files = [], items } = action.payload;

    let hasFolders = false;
    Array.from(items).forEach((item) => {
      const entry = item.webkitGetAsEntry();
      if (entry && entry.isDirectory) {
        hasFolders = true;
      }
    });

    files = files.filter((file) => !isEmpty(file.type));

    if (isEmpty(files) && !hasFolders) {
      NotificationManager.error(t('document-library.uploading-file.message.abort'), t('error'));
      return;
    }

    if (item.type === NODE_TYPES.DIR) {
      folderId = item.id;
      folderTitle = yield call(DocLibService.getFolderTitle, folderId);
    }

    function traverseDirectory(entry, path = '') {
      return new Promise((resolve, reject) => {
        let files = [];
        const dirReader = entry.createReader();
        const currentPath = path ? `${path}/${entry.name}` : entry.name;

        const readEntries = () => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve(files);
              return;
            }

            try {
              for (const entry of entries) {
                if (entry.isFile) {
                  const file = await new Promise((resolveFile) => entry.file(resolveFile));
                  files.push({ file, name: file.name, path: `${currentPath}/${file.name}` });
                } else if (entry.isDirectory) {
                  const nestedFiles = await traverseDirectory(entry, currentPath);
                  files = files.concat(nestedFiles);
                }
              }
            } catch (err) {
              reject(err);
            }

            readEntries();
          });
        };

        readEntries();
      });
    }

    const entries = yield action.payload.items.map((item) => item.webkitGetAsEntry());
    let totalCount = 0;

    const itemsObj = yield entries.map(function* (entry) {
      if (entry && entry.isDirectory) {
        const filesOfDir = yield traverseDirectory(entry);
        totalCount += (filesOfDir || []).length;

        return { name: entry.name, files: filesOfDir, nodeType: NODE_TYPES.DIR };
      } else if (entry && entry.isFile) {
        totalCount += 1;

        const file = yield new Promise((resolve, reject) => {
          entry.file(
            (file) => resolve(file),
            (error) => reject(error),
          );
        });

        return { file, name: file.name, nodeType: NODE_TYPES.FILE, path: `/${file.name}` };
      }
    });

    const destinations = {
      file: get(createVariantFile, 'destination'),
      dir: get(createVariantDir, 'destination'),
    };

    // Init web-worker
    const { worker, send } = yield call(initializeWorker);

    const uploadPromise = new Promise((resolve) => {
      worker.onmessage = (event) => {
        const { status, result, file = {}, totalCount, successFileCount, requestId, isCancelled, errorStatus } = event.data;

        if (navigator.serviceWorker.controller) {
          switch (status) {
            case 'start':
            case 'confirm-file-replacement':
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status,
                file,
              });
              break;

            case 'in-progress':
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status,
                file,
                totalCount,
                successFileCount,
                requestId,
              });
              break;

            case 'success':
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status,
                result,
              });
              resolve();
              break;

            case 'error':
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status,
                errorStatus,
                file,
                isCancelled,
              });
              break;

            default:
              break;
          }
        }
      };

      navigator.serviceWorker.onmessage = (event) => {
        const { type, confirmed, isReplaceAllFiles } = event.data;

        if (type === 'CONFIRMATION_FILE_RESPONSE') {
          worker.postMessage({ status: 'confirmation-file-response', confirmed, isReplaceAllFiles });
        }
      };
    });

    yield send({
      items: itemsObj,
      rootId,
      folderId,
      folderTitle,
      destinations,
      totalCount,
      ...(get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false) && { ws: getWorkspaceId() }),
    });

    yield call(() => uploadPromise);
    yield put(initSidebar(w()));
    yield put(loadFolderData(w()));
    yield put(loadFilesViewerData(w()));
  } catch (e) {
    console.error('[docLib sagaUploadFiles saga error', e);
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
  yield takeLatest(changeNode().type, wrapSaga, { ...ea, saga: sagaChangeNode });
  yield takeEvery(uploadFiles().type, wrapSaga, { ...ea, saga: sagaUploadFiles });
  yield takeEvery(getTypeRef().type, wrapSaga, { ...ea, saga: sagaGetTypeRef });
  yield takeEvery(setParentItem().type, wrapSaga, { ...ea, saga: sagaSetParentItem });
}

export default saga;
