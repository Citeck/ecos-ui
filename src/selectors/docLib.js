import { createSelector } from 'reselect';
import get from 'lodash/get';
import { defaultState } from '../reducers/documentLibrary';

const selectDocLib = (state, key) => get(state, ['documentLibrary', key]) || { ...defaultState };

export const selectIsDocLibEnabled = createSelector(
  selectDocLib,
  docLib => get(docLib, 'isEnabled', false)
);

export const selectDocLibFileTypeRefs = createSelector(
  selectDocLib,
  docLib => get(docLib, 'fileTypeRefs', [])
);

export const selectDocLibDirTypeRef = createSelector(
  selectDocLib,
  docLib => get(docLib, 'dirTypeRef', null)
);

export const selectDocLibCreateVariants = createSelector(
  selectDocLib,
  docLib => get(docLib, 'createVariants', [])
);

export const selectDocLibRootId = createSelector(
  selectDocLib,
  docLib => get(docLib, 'rootId', null)
);

export const selectDocLibTypeRef = createSelector(
  selectDocLib,
  docLib => get(docLib, 'typeRef', null)
);

export const selectDocLibSidebar = createSelector(
  selectDocLib,
  docLib => get(docLib, 'sidebar', {})
);

export const selectDocLibFileViewer = createSelector(
  selectDocLib,
  docLib => get(docLib, 'fileViewer', {})
);

export const selectDocLibFileViewerIsReady = createSelector(
  selectDocLibFileViewer,
  fileViewer => get(fileViewer, 'isReady', false)
);

export const selectDocLibFileViewerPagination = createSelector(
  selectDocLibFileViewer,
  fileViewer => get(fileViewer, 'pagination', {})
);

export const selectDocLibFileViewerTotal = createSelector(
  selectDocLibFileViewer,
  fileViewer => get(fileViewer, 'total', 0)
);

export const selectDocLibFileCanUploadFiles = createSelector(
  selectDocLib,
  docLib => get(docLib, 'canUploadFiles', false)
);

export const selectDocLibFileViewerLoadingStatus = createSelector(
  selectDocLibFileViewer,
  fileViewer => get(fileViewer, 'isLoading', false)
);

export const selectDocLibFolderId = createSelector(
  selectDocLib,
  docLib => get(docLib, 'folderId', null)
);

export const selectDocLibFolderTitle = createSelector(
  selectDocLib,
  docLib => get(docLib, 'folderTitle', null)
);

export const selectDocLibFolderPath = createSelector(
  selectDocLib,
  docLib => get(docLib, 'folderPath', null)
);

export const selectDocLibSearchText = createSelector(
  selectDocLib,
  docLib => get(docLib, 'searchText', null)
);

export const selectDocLibGroupActions = createSelector(
  selectDocLib,
  docLib => get(docLib, 'groupActions', {})
);

export const selectDocLibPageProps = createSelector(
  [selectIsDocLibEnabled, selectDocLibFolderTitle, selectDocLibTypeRef, selectDocLibRootId],
  (isDocLibEnabled, docLibFolderTitle, docLibTypeRef) => ({
    isDocLibEnabled,
    docLibFolderTitle,
    docLibTypeRef
  })
);
