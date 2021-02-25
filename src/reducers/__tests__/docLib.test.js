import { wrapArgs } from '../../helpers/redux';
import reducer from '../journals';
import {
  setIsDocLibEnabled,
  setTypeRef,
  setFileTypeRefs,
  setDirTypeRef,
  setCreateVariants,
  setRootId,
  setFolderId,
  setFolderTitle,
  setFolderPath,
  setSearchText,
  setSidebarItems,
  addSidebarItems,
  setSidebarIsReady,
  setSidebarError,
  foldSidebarItem,
  unfoldSidebarItem,
  updateSidebarItem,
  setFileViewerIsReady,
  setFileViewerItems,
  setFileViewerError,
  setFileViewerPagination,
  setFileViewerTotal,
  setFileViewerSelected,
  setFileViewerLastClicked,
  setIsGroupActionsReady,
  setGroupActions
} from '../../actions/docLib';
import { initState } from '../../actions/journals';

const testStateId = 'testStateId';
const initialState = reducer(undefined, initState(testStateId));
const w = wrapArgs(testStateId);

describe('docLib (journal) reducer tests', () => {
  it('should return the initial state', () => {
    expect(reducer(initialState, {})).toEqual(initialState);
  });

  it(`should handle "setIsDocLibEnabled"`, () => {
    const newState = reducer(initialState, setIsDocLibEnabled(w(true)));
    expect(newState[testStateId].documentLibrary.isEnabled).toBe(true);
  });

  it(`should handle "setTypeRef"`, () => {
    const newState = reducer(initialState, setTypeRef(w('testTypeRef')));
    expect(newState[testStateId].documentLibrary.typeRef).toBe('testTypeRef');
  });

  it(`should handle "setFileTypeRefs"`, () => {
    const newState = reducer(initialState, setFileTypeRefs(w(undefined)));
    expect(newState[testStateId].documentLibrary.fileTypeRefs).toEqual([]);
    const newState2 = reducer(initialState, setFileTypeRefs(w(null)));
    expect(newState2[testStateId].documentLibrary.fileTypeRefs).toEqual([]);
    const newState3 = reducer(initialState, setFileTypeRefs(w('string')));
    expect(newState3[testStateId].documentLibrary.fileTypeRefs).toEqual([]);
    const newState4 = reducer(initialState, setFileTypeRefs(w(0)));
    expect(newState4[testStateId].documentLibrary.fileTypeRefs).toEqual([]);
    const fileTypes = ['type1', 'type2'];
    const newState5 = reducer(initialState, setFileTypeRefs(w(fileTypes)));
    expect(newState5[testStateId].documentLibrary.fileTypeRefs).toEqual(fileTypes);
  });

  it(`should handle "setDirTypeRef"`, () => {
    const newState = reducer(initialState, setDirTypeRef(w('testDirTypeRef')));
    expect(newState[testStateId].documentLibrary.dirTypeRef).toBe('testDirTypeRef');
  });

  it(`should handle "setCreateVariants"`, () => {
    const newState = reducer(initialState, setCreateVariants(w(undefined)));
    expect(newState[testStateId].documentLibrary.createVariants).toEqual([]);
    const newState2 = reducer(initialState, setCreateVariants(w(null)));
    expect(newState2[testStateId].documentLibrary.createVariants).toEqual([]);
    const newState3 = reducer(initialState, setCreateVariants(w('string')));
    expect(newState3[testStateId].documentLibrary.createVariants).toEqual([]);
    const newState4 = reducer(initialState, setCreateVariants(w(0)));
    expect(newState4[testStateId].documentLibrary.createVariants).toEqual([]);
    const createVariants = [{ title: 'variant 1', destination: 'typeRef1' }];
    const newState5 = reducer(initialState, setCreateVariants(w(createVariants)));
    expect(newState5[testStateId].documentLibrary.createVariants).toEqual(createVariants);
  });

  it(`should handle "setRootId"`, () => {
    const newState = reducer(initialState, setRootId(w('testRootId')));
    expect(newState[testStateId].documentLibrary.rootId).toBe('testRootId');
  });

  it(`should handle "setFolderId"`, () => {
    const newState = reducer(initialState, setFolderId(w('testFolderId')));
    expect(newState[testStateId].documentLibrary.folderId).toBe('testFolderId');
  });

  it(`should handle "setFolderTitle"`, () => {
    const newState = reducer(initialState, setFolderTitle(w('testFolderTitle')));
    expect(newState[testStateId].documentLibrary.folderTitle).toBe('testFolderTitle');
  });

  it(`should handle "setFolderPath"`, () => {
    const newState = reducer(initialState, setFolderPath(w(undefined)));
    expect(newState[testStateId].documentLibrary.folderPath).toEqual([]);
    const newState2 = reducer(initialState, setFolderPath(w(null)));
    expect(newState2[testStateId].documentLibrary.folderPath).toEqual([]);
    const newState3 = reducer(initialState, setFolderPath(w('string')));
    expect(newState3[testStateId].documentLibrary.folderPath).toEqual([]);
    const newState4 = reducer(initialState, setFolderPath(w(0)));
    expect(newState4[testStateId].documentLibrary.folderPath).toEqual([]);
    const fileTypes = [{ id: 'test1', disp: 'Test 1' }];
    const newState5 = reducer(initialState, setFolderPath(w(fileTypes)));
    expect(newState5[testStateId].documentLibrary.folderPath).toEqual(fileTypes);
  });

  it(`should handle "setSearchText"`, () => {
    const newState = reducer(initialState, setSearchText(w('testSearchText')));
    expect(newState[testStateId].documentLibrary.searchText).toBe('testSearchText');
  });

  it(`should handle "setSidebarItems"`, () => {
    const items = [{ id: 'item1' }, { id: 'item2' }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    expect(newState[testStateId].documentLibrary.sidebar.items).toEqual(items);
  });

  it(`should handle "addSidebarItems"`, () => {
    const items = [{ id: 'item1' }, { id: 'item2' }, { id: 'item3' }];
    const newState = reducer(initialState, addSidebarItems(w(items)));
    expect(newState[testStateId].documentLibrary.sidebar.items).toEqual(items);
    const items2 = [{ id: 'item2' }, { id: 'item3' }, { id: 'item4' }];
    const newState2 = reducer(newState, addSidebarItems(w(items2)));
    expect(newState2[testStateId].documentLibrary.sidebar.items).toEqual([
      { id: 'item1' },
      { id: 'item2' },
      { id: 'item3' },
      { id: 'item4' }
    ]);
  });

  it(`should handle "setSidebarIsReady"`, () => {
    const newState = reducer(initialState, setSidebarIsReady(w(true)));
    expect(newState[testStateId].documentLibrary.sidebar.isReady).toBe(true);
  });

  it(`should handle "setSidebarError"`, () => {
    const newState = reducer(initialState, setSidebarError(w(true)));
    expect(newState[testStateId].documentLibrary.sidebar.hasError).toBe(true);
  });

  it(`should handle "foldSidebarItem"`, () => {
    const items = [{ id: 'item1', isUnfolded: true }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    const newState2 = reducer(newState, foldSidebarItem(w(items[0].id)));
    const sidebarItems = newState2[testStateId].documentLibrary.sidebar.items;
    const foldedItem = sidebarItems.find(item => item.id === items[0].id);
    expect(foldedItem.isUnfolded).toBe(false);
  });

  it(`should handle "unfoldSidebarItem"`, () => {
    const items = [{ id: 'item1' }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    const newState2 = reducer(newState, unfoldSidebarItem(w(items[0].id)));
    const sidebarItems = newState2[testStateId].documentLibrary.sidebar.items;
    const unfoldedItem = sidebarItems.find(item => item.id === items[0].id);
    expect(unfoldedItem.isUnfolded).toBe(true);
  });

  it(`should handle "updateSidebarItem"`, () => {
    const items = [{ id: 'item1', title: 'initial', isUnfolded: false }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    const newState2 = reducer(newState, updateSidebarItem(w({ id: 'item1', title: 'changed', isUnfolded: true })));
    const sidebarItems = newState2[testStateId].documentLibrary.sidebar.items;
    const updatedItem = sidebarItems.find(item => item.id === items[0].id);
    expect(updatedItem.title).toBe('changed');
    expect(updatedItem.isUnfolded).toBe(true);
  });

  it(`should handle "setFileViewerIsReady"`, () => {
    const newState = reducer(initialState, setFileViewerIsReady(w(true)));
    expect(newState[testStateId].documentLibrary.fileViewer.isReady).toBe(true);
  });

  it(`should handle "setFileViewerItems"`, () => {
    const items = [{ id: 'item1' }, { id: 'item2' }];
    const newState = reducer(initialState, setFileViewerItems(w(items)));
    expect(newState[testStateId].documentLibrary.fileViewer.items).toEqual(items);
  });

  it(`should handle "setFileViewerError"`, () => {
    const newState = reducer(initialState, setFileViewerError(w(true)));
    expect(newState[testStateId].documentLibrary.fileViewer.hasError).toBe(true);
  });

  it(`should handle "setFileViewerPagination"`, () => {
    const testPagination = {
      skipCount: 3,
      maxItems: 15,
      page: 2
    };
    const newState = reducer(initialState, setFileViewerPagination(w(testPagination)));
    expect(newState[testStateId].documentLibrary.fileViewer.pagination).toEqual(testPagination);
    const newState2 = reducer(newState, setFileViewerPagination(w({ skipCount: 5 })));
    expect(newState2[testStateId].documentLibrary.fileViewer.pagination).toEqual({
      skipCount: 5,
      maxItems: 15,
      page: 2
    });
  });

  it(`should handle "setFileViewerTotal"`, () => {
    const newState = reducer(initialState, setFileViewerTotal(w(42)));
    expect(newState[testStateId].documentLibrary.fileViewer.total).toBe(42);
  });

  it(`should handle "setFileViewerSelected"`, () => {
    const newState = reducer(initialState, setFileViewerSelected(w(undefined)));
    expect(newState[testStateId].documentLibrary.fileViewer.selected).toEqual([]);
    const newState2 = reducer(initialState, setFileViewerSelected(w(null)));
    expect(newState2[testStateId].documentLibrary.fileViewer.selected).toEqual([]);
    const newState3 = reducer(initialState, setFileViewerSelected(w('string')));
    expect(newState3[testStateId].documentLibrary.fileViewer.selected).toEqual([]);
    const newState4 = reducer(initialState, setFileViewerSelected(w(0)));
    expect(newState4[testStateId].documentLibrary.fileViewer.selected).toEqual([]);
    const fileTypes = ['test1', 'test2'];
    const newState5 = reducer(initialState, setFileViewerSelected(w(fileTypes)));
    expect(newState5[testStateId].documentLibrary.fileViewer.selected).toEqual(fileTypes);
  });

  it(`should handle "setFileViewerLastClicked"`, () => {
    const newState = reducer(initialState, setFileViewerLastClicked(w(42)));
    expect(newState[testStateId].documentLibrary.fileViewer.lastClicked).toBe(42);
  });

  it(`should handle "setIsGroupActionsReady"`, () => {
    const newState = reducer(initialState, setIsGroupActionsReady(w(true)));
    expect(newState[testStateId].documentLibrary.groupActions.isReady).toBe(true);
  });

  it(`should handle "setGroupActions"`, () => {
    const groupActions = {
      forRecords: {
        actions: [1, 2, 3]
      },
      forQuery: {
        actions: [3, 2, 1]
      }
    };
    const newState = reducer(initialState, setGroupActions(w(groupActions)));
    expect(newState[testStateId].documentLibrary.groupActions.forRecords).toEqual(groupActions.forRecords);
    expect(newState[testStateId].documentLibrary.groupActions.forQuery).toEqual(groupActions.forQuery);
  });
});
