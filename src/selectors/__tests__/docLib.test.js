import {
  selectDocLib,
  selectIsDocLibEnabled,
  selectDocLibFileTypeRefs,
  selectDocLibDirTypeRef,
  selectDocLibCreateVariants,
  selectDocLibRootId,
  selectDocLibTypeRef,
  selectDocLibSidebar,
  selectDocLibFileViewer,
  selectDocLibFileViewerIsReady,
  selectDocLibFileViewerPagination,
  selectDocLibFileViewerTotal,
  selectDocLibFolderId,
  selectDocLibFolderTitle,
  selectDocLibFolderPath,
  selectDocLibSearchText,
  selectDocLibGroupActions
} from '../docLib';
import { testState, testStateId, documentLibrary, sidebar, fileViewer, createVariants } from '../__mocks__/docLib.mock';

describe('docLib selectors tests', () => {
  it('selectDocLib', () => {
    expect(selectDocLib(testState, testStateId)).toEqual(documentLibrary);
  });

  it('selectIsDocLibEnabled', () => {
    expect(selectIsDocLibEnabled(testState, testStateId)).toBe(documentLibrary.isEnabled);
  });

  it('selectDocLibFileTypeRefs', () => {
    expect(selectDocLibFileTypeRefs(testState, testStateId)).toEqual(documentLibrary.fileTypeRefs);
  });

  it('selectDocLibDirTypeRef', () => {
    expect(selectDocLibDirTypeRef(testState, testStateId)).toBe(documentLibrary.dirTypeRef);
  });

  it('selectDocLibCreateVariants', () => {
    expect(selectDocLibCreateVariants(testState, testStateId)).toBe(createVariants);
  });

  it('selectDocLibRootId', () => {
    expect(selectDocLibRootId(testState, testStateId)).toBe(documentLibrary.rootId);
  });

  it('selectDocLibTypeRef', () => {
    expect(selectDocLibTypeRef(testState, testStateId)).toBe(documentLibrary.typeRef);
  });

  it('selectDocLibSidebar', () => {
    expect(selectDocLibSidebar(testState, testStateId)).toEqual(sidebar);
  });

  it('selectDocLibFileViewer', () => {
    expect(selectDocLibFileViewer(testState, testStateId)).toEqual(fileViewer);
  });

  it('selectDocLibFileViewerIsReady', () => {
    expect(selectDocLibFileViewerIsReady(testState, testStateId)).toBe(fileViewer.isReady);
  });

  it('selectDocLibFileViewerPagination', () => {
    expect(selectDocLibFileViewerPagination(testState, testStateId)).toEqual(fileViewer.pagination);
  });

  it('selectDocLibFileViewerTotal', () => {
    expect(selectDocLibFileViewerTotal(testState, testStateId)).toBe(fileViewer.total);
  });

  it('selectDocLibFolderId', () => {
    expect(selectDocLibFolderId(testState, testStateId)).toBe(documentLibrary.folderId);
  });

  it('selectDocLibFolderTitle', () => {
    expect(selectDocLibFolderTitle(testState, testStateId)).toBe(documentLibrary.folderTitle);
  });

  it('selectDocLibFolderPath', () => {
    expect(selectDocLibFolderPath(testState, testStateId)).toEqual(documentLibrary.folderPath);
  });

  it('selectDocLibSearchText', () => {
    expect(selectDocLibSearchText(testState, testStateId)).toBe(documentLibrary.searchText);
  });

  it('selectDocLibGroupActions', () => {
    expect(selectDocLibGroupActions(testState, testStateId)).toBe(documentLibrary.groupActions);
  });
});
