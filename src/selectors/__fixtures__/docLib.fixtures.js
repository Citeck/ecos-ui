import { DEFAULT_PAGINATION } from '../../components/Journals/constants';

export const sidebar = {
  isReady: true,
  items: [],
  hasError: false
};

export const fileViewer = {
  isReady: false,
  items: [{ id: 'item1' }],
  selected: [],
  lastClicked: null,
  total: 0,
  pagination: DEFAULT_PAGINATION,
  hasError: false
};

export const createVariants = [{ title: 'variant 1', destination: 'typeRef1' }, { title: 'variant 2', destination: 'typeRef2' }];

export const documentLibrary = {
  isEnabled: true,
  typeRef: 'testTypeRef',
  fileTypeRefs: ['testFileTypeRef1', 'testFileTypeRef2'],
  dirTypeRef: 'testDirTypeRef',
  rootId: 'testRootId',
  folderId: 'testFolderId',
  folderTitle: 'testFolderTitle',
  folderPath: [{ id: 'test1', disp: 'Test 1' }, { id: 'test2', disp: 'Test 2' }],
  searchText: 'testSearchText',
  groupActions: {
    isReady: false
  },
  createVariants,
  sidebar,
  fileViewer
};

export const testStateId = 'testStateId';
export const testState = {
  journals: {
    [testStateId]: {
      documentLibrary
    }
  }
};
