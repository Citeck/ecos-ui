import get from 'lodash/get';
import { wrapArgs } from '../../helpers/redux';
import reducer from '../documentLibrary';
import {
  addSidebarItems,
  foldSidebarItem,
  setCreateVariants,
  setDirTypeRef,
  setFileTypeRefs,
  setFileViewerError,
  setFileViewerIsReady,
  setFileViewerItems,
  setFileViewerLastClicked,
  setFileViewerPagination,
  setFileViewerSelected,
  setFileViewerTotal,
  setFolderId,
  setFolderPath,
  setFolderTitle,
  setGroupActions,
  setIsDocLibEnabled,
  setIsGroupActionsReady,
  setRootId,
  setSearchText,
  setSidebarError,
  setSidebarIsReady,
  setSidebarItems,
  setTypeRef,
  unfoldSidebarItem,
  updateSidebarItem
} from '../../actions/docLib';

const testStateId = 'testStateId';
const w = wrapArgs(testStateId);
const initialState = reducer(undefined, setIsDocLibEnabled(w(false)));
const getState = state => get(state, [testStateId]) || {};

describe('docLib (journal) reducer tests', () => {
  it('should return the initial state', () => {
    expect(reducer(initialState, {})).toEqual(initialState);
  });

  it(`should handle "setIsDocLibEnabled"`, () => {
    const newState = reducer(initialState, setIsDocLibEnabled(w(true)));
    expect(getState(newState).isEnabled).toBe(true);
  });

  it(`should handle "setTypeRef"`, () => {
    const newState = reducer(initialState, setTypeRef(w('testTypeRef')));
    expect(getState(newState).typeRef).toBe('testTypeRef');
  });

  it(`should handle "setFileTypeRefs"`, () => {
    const newState = reducer(initialState, setFileTypeRefs(w(undefined)));
    expect(getState(newState).fileTypeRefs).toEqual([]);
    const newState2 = reducer(initialState, setFileTypeRefs(w(null)));
    expect(getState(newState2).fileTypeRefs).toEqual([]);
    const newState3 = reducer(initialState, setFileTypeRefs(w('string')));
    expect(getState(newState3).fileTypeRefs).toEqual([]);
    const newState4 = reducer(initialState, setFileTypeRefs(w(0)));
    expect(getState(newState4).fileTypeRefs).toEqual([]);
    const fileTypes = ['type1', 'type2'];
    const newState5 = reducer(initialState, setFileTypeRefs(w(fileTypes)));
    expect(getState(newState5).fileTypeRefs).toEqual(fileTypes);
  });
  it(`should handle "setDirTypeRef"`, () => {
    const newState = reducer(initialState, setDirTypeRef(w('testDirTypeRef')));
    expect(getState(newState).dirTypeRef).toBe('testDirTypeRef');
  });

  it(`should handle "setCreateVariants"`, () => {
    const newState = reducer(initialState, setCreateVariants(w(undefined)));
    expect(getState(newState).createVariants).toEqual([]);
    const newState2 = reducer(initialState, setCreateVariants(w(null)));
    expect(getState(newState2).createVariants).toEqual([]);
    const newState3 = reducer(initialState, setCreateVariants(w('string')));
    expect(getState(newState3).createVariants).toEqual([]);
    const newState4 = reducer(initialState, setCreateVariants(w(0)));
    expect(getState(newState4).createVariants).toEqual([]);
    const createVariants = [{ title: 'variant 1', destination: 'typeRef1' }];
    const newState5 = reducer(initialState, setCreateVariants(w(createVariants)));
    expect(getState(newState5).createVariants).toEqual(createVariants);
  });

  it(`should handle "setRootId"`, () => {
    const newState = reducer(initialState, setRootId(w('testRootId')));
    expect(getState(newState).rootId).toBe('testRootId');
  });

  it(`should handle "setFolderId"`, () => {
    const newState = reducer(initialState, setFolderId(w('testFolderId')));
    expect(getState(newState).folderId).toBe('testFolderId');
  });

  it(`should handle "setFolderTitle"`, () => {
    const newState = reducer(initialState, setFolderTitle(w('testFolderTitle')));
    expect(getState(newState).folderTitle).toBe('testFolderTitle');
  });

  it(`should handle "setFolderPath"`, () => {
    const newState = reducer(initialState, setFolderPath(w(undefined)));
    expect(getState(newState).folderPath).toEqual([]);
    const newState2 = reducer(initialState, setFolderPath(w(null)));
    expect(getState(newState2).folderPath).toEqual([]);
    const newState3 = reducer(initialState, setFolderPath(w('string')));
    expect(getState(newState3).folderPath).toEqual([]);
    const newState4 = reducer(initialState, setFolderPath(w(0)));
    expect(getState(newState4).folderPath).toEqual([]);
    const fileTypes = [{ id: 'test1', disp: 'Test 1' }];
    const newState5 = reducer(initialState, setFolderPath(w(fileTypes)));
    expect(getState(newState5).folderPath).toEqual(fileTypes);
  });

  it(`should handle "setSearchText"`, () => {
    const newState = reducer(initialState, setSearchText(w('testSearchText')));
    expect(getState(newState).searchText).toBe('testSearchText');
  });

  it(`should handle "setSidebarItems"`, () => {
    const items = [{ id: 'item1' }, { id: 'item2' }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    expect(getState(newState).sidebar.items).toEqual(items);
  });

  it(`should handle "addSidebarItems"`, () => {
    const items = [{ id: 'item1' }, { id: 'item2' }, { id: 'item3' }];
    const newState = reducer(initialState, addSidebarItems(w(items)));
    expect(getState(newState).sidebar.items).toEqual(items);
    const items2 = [{ id: 'item2' }, { id: 'item3' }, { id: 'item4' }];
    const newState2 = reducer(newState, addSidebarItems(w(items2)));
    expect(getState(newState2).sidebar.items).toEqual([{ id: 'item1' }, { id: 'item2' }, { id: 'item3' }, { id: 'item4' }]);
  });

  it(`should handle "setSidebarIsReady"`, () => {
    const newState = reducer(initialState, setSidebarIsReady(w(true)));
    expect(getState(newState).sidebar.isReady).toBe(true);
  });

  it(`should handle "setSidebarError"`, () => {
    const newState = reducer(initialState, setSidebarError(w(true)));
    expect(getState(newState).sidebar.hasError).toBe(true);
  });

  it(`should handle "foldSidebarItem"`, () => {
    const items = [{ id: 'item1', isUnfolded: true }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    const newState2 = reducer(newState, foldSidebarItem(w(items[0].id)));
    const sidebarItems = getState(newState2).sidebar.items;
    const foldedItem = sidebarItems.find(item => item.id === items[0].id);
    expect(foldedItem.isUnfolded).toBe(false);
  });

  it(`should handle "unfoldSidebarItem"`, () => {
    const items = [{ id: 'item1' }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    const newState2 = reducer(newState, unfoldSidebarItem(w(items[0].id)));
    const sidebarItems = getState(newState2).sidebar.items;
    const unfoldedItem = sidebarItems.find(item => item.id === items[0].id);
    expect(unfoldedItem.isUnfolded).toBe(true);
  });

  it(`should handle "updateSidebarItem"`, () => {
    const items = [{ id: 'item1', title: 'initial', isUnfolded: false }];
    const newState = reducer(initialState, setSidebarItems(w(items)));
    const newState2 = reducer(newState, updateSidebarItem(w({ id: 'item1', title: 'changed', isUnfolded: true })));
    const sidebarItems = getState(newState2).sidebar.items;
    const updatedItem = sidebarItems.find(item => item.id === items[0].id);
    expect(updatedItem.title).toBe('changed');
    expect(updatedItem.isUnfolded).toBe(true);
  });

  it(`should handle "setFileViewerIsReady"`, () => {
    const newState = reducer(initialState, setFileViewerIsReady(w(true)));
    expect(getState(newState).fileViewer.isReady).toBe(true);
  });

  it(`should handle "setFileViewerItems"`, () => {
    const items = [{ id: 'item1' }, { id: 'item2' }];
    const newState = reducer(initialState, setFileViewerItems(w(items)));
    expect(getState(newState).fileViewer.items).toEqual(items);
  });

  it(`should handle "setFileViewerError"`, () => {
    const newState = reducer(initialState, setFileViewerError(w(true)));
    expect(getState(newState).fileViewer.hasError).toBe(true);
  });

  it(`should handle "setFileViewerPagination"`, () => {
    const testPagination = {
      skipCount: 3,
      maxItems: 15,
      page: 2
    };
    const newState = reducer(initialState, setFileViewerPagination(w(testPagination)));
    expect(getState(newState).fileViewer.pagination).toEqual(testPagination);
    const newState2 = reducer(newState, setFileViewerPagination(w({ skipCount: 5 })));
    expect(getState(newState2).fileViewer.pagination).toEqual({
      skipCount: 5,
      maxItems: 15,
      page: 2
    });
  });

  it(`should handle "setFileViewerTotal"`, () => {
    const newState = reducer(initialState, setFileViewerTotal(w(42)));
    expect(getState(newState).fileViewer.total).toBe(42);
  });

  it(`should handle "setFileViewerSelected"`, () => {
    const newState = reducer(initialState, setFileViewerSelected(w(undefined)));
    expect(getState(newState).fileViewer.selected).toEqual([]);
    const newState2 = reducer(initialState, setFileViewerSelected(w(null)));
    expect(getState(newState2).fileViewer.selected).toEqual([]);
    const newState3 = reducer(initialState, setFileViewerSelected(w('string')));
    expect(getState(newState3).fileViewer.selected).toEqual([]);
    const newState4 = reducer(initialState, setFileViewerSelected(w(0)));
    expect(getState(newState4).fileViewer.selected).toEqual([]);
    const fileTypes = ['test1', 'test2'];
    const newState5 = reducer(initialState, setFileViewerSelected(w(fileTypes)));
    expect(getState(newState5).fileViewer.selected).toEqual(fileTypes);
  });

  it(`should handle "setFileViewerLastClicked"`, () => {
    const newState = reducer(initialState, setFileViewerLastClicked(w(42)));
    expect(getState(newState).fileViewer.lastClicked).toBe(42);
  });

  it(`should handle "setIsGroupActionsReady"`, () => {
    const newState = reducer(initialState, setIsGroupActionsReady(w(true)));
    expect(getState(newState).groupActions.isReady).toBe(true);
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
    expect(getState(newState).groupActions.forRecords).toEqual(groupActions.forRecords);
    expect(getState(newState).groupActions.forQuery).toEqual(groupActions.forQuery);
  });
});
