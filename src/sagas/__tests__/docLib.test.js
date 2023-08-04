import { runSaga } from 'redux-saga';
import clone from 'lodash/clone';

import DocLibService from '../../components/Journals/DocLib/DocLibService';
import JournalsService from '../../components/Journals/service/journalsService';
import { DocLibUrlParams, SourcesId } from '../../constants';
import { wrapArgs } from '../../helpers/redux';
import {
  loadDocumentLibrarySettings,
  sagaExecGroupAction,
  sagaGetTypeRef,
  sagaInitDocumentLibrary,
  sagaInitDocumentLibrarySidebar,
  sagaInitGroupActions
} from '../docLib';
import {
  loadFolderData,
  setFolderId,
  setGroupActions,
  setIsDocLibEnabled,
  setIsGroupActionsReady,
  setSearchText,
  setSidebarIsReady
} from '../../actions/docLib';

const journalId = 'testJournalId';
const typeRef = 'testTypeRef';
const stateId = 'testStateId';
const rootId = 'testRootId';
const dirType = 'testDirType';
const fileType = 'testFileType';
const w = wrapArgs(stateId);
const logger = {
  error: jest.fn()
};

const fakeState = {
  journals: {
    [stateId]: {
      url: {}
    }
  },
  documentLibrary: {
    [stateId]: {
      rootId: ''
    }
  }
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('docLib sagas tests', () => {
  describe('sagaGetTypeRef saga', () => {
    it('should set isDocLibEnabled=false if typeRef is empty', async () => {
      const dispatched = [];
      const getTypeRefSpy = jest.spyOn(DocLibService, 'getTypeRef').mockResolvedValue(null);

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        sagaGetTypeRef,
        { logger, stateId, w },
        { payload: { journalId } }
      ).done;

      expect(getTypeRefSpy).toHaveBeenCalledTimes(1);
      expect(dispatched[0]).toEqual(setIsDocLibEnabled(w(false)));
    });

    it('should set isDocLibEnabled and typeRef saga', async () => {
      const dispatched = [];
      const getTypeRefSpy = jest.spyOn(DocLibService, 'getTypeRef').mockResolvedValue(typeRef);
      const isDocLibEnabledSpy = jest.spyOn(DocLibService, 'isDocLibEnabled').mockResolvedValue(true);

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        sagaGetTypeRef,
        { logger, stateId, w },
        { payload: { journalId } }
      ).done;

      expect(getTypeRefSpy).toHaveBeenCalledTimes(1);
      expect(getTypeRefSpy).toHaveBeenCalledWith(journalId);
      expect(isDocLibEnabledSpy).toHaveBeenCalled();
      expect(isDocLibEnabledSpy).toHaveBeenCalledWith(typeRef);
      expect(dispatched.length).toEqual(3);
    });
  });

  describe('loadDocumentLibrarySettings saga', () => {
    it('should done loadDocumentLibrarySettings saga', async () => {
      const dispatched = [];
      const getFileTypeRefsSpy = jest.spyOn(DocLibService, 'getFileTypeRefs').mockResolvedValue([fileType]);
      const getDirTypeRefSpy = jest.spyOn(DocLibService, 'getDirTypeRef').mockResolvedValue(dirType);
      const getCreateVariantsSpy = jest.spyOn(DocLibService, 'getCreateVariants').mockResolvedValue([]);
      const getRootIdSpy = jest.spyOn(DocLibService, 'getRootId').mockResolvedValue(rootId);

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        loadDocumentLibrarySettings,
        typeRef,
        w
      ).done;

      expect(getFileTypeRefsSpy).toHaveBeenCalled();
      expect(getFileTypeRefsSpy).toHaveBeenCalledWith(typeRef);
      expect(getDirTypeRefSpy).toHaveBeenCalled();
      expect(getDirTypeRefSpy).toHaveBeenCalledWith(typeRef);
      expect(getCreateVariantsSpy).toHaveBeenCalled();
      expect(getCreateVariantsSpy).toHaveBeenCalledWith(dirType, [fileType]);
      expect(getRootIdSpy).toHaveBeenCalled();
      expect(getRootIdSpy).toHaveBeenCalledWith(typeRef);
      expect(dispatched.length).toBe(4);
    });
  });

  describe('sagaInitDocumentLibrary saga', () => {
    it('should set folderId=rootId if No "folderId" url-parameter', async () => {
      const dispatched = [];
      const thisState = clone(fakeState);
      thisState.documentLibrary[stateId].rootId = rootId;
      thisState.documentLibrary[stateId].typeRef = typeRef;

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => thisState
        },
        sagaInitDocumentLibrary,
        { stateId, w, logger }
      ).done;

      const setFolderIdAction = dispatched.find(item => item.type === setFolderId().type);
      expect(setFolderIdAction.payload).toEqual(w(rootId));
    });

    it(`should set folderId from "${DocLibUrlParams.FOLDER_ID}" url-parameter`, async () => {
      const dispatched = [];
      const thisState = clone(fakeState);
      thisState.journals[stateId].url[DocLibUrlParams.FOLDER_ID] = 'folder1';

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => thisState
        },
        sagaInitDocumentLibrary,
        { stateId, w, logger }
      ).done;

      const setFolderIdAction = dispatched.find(item => item.type === setFolderId().type);
      expect(setFolderIdAction.payload).toEqual(w('folder1'));
    });

    it(`should set searchText from "${DocLibUrlParams.SEARCH}" url-parameter`, async () => {
      const dispatched = [];
      const thisState = clone(fakeState);
      thisState.journals[stateId].url[DocLibUrlParams.SEARCH] = 'search text';

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => thisState
        },
        sagaInitDocumentLibrary,
        { stateId, w, logger }
      ).done;

      const setSearchTextAction = dispatched.find(item => item.type === setSearchText().type);
      expect(setSearchTextAction.payload).toEqual(w('search text'));
    });

    it('should put loadFolderData', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => fakeState
        },
        sagaInitDocumentLibrary,
        { stateId, w, logger }
      ).done;

      const loadFolderDataAction = dispatched.findIndex(item => item.type === loadFolderData().type);
      expect(loadFolderDataAction).not.toEqual(-1);
    });
  });

  describe('sagaInitDocumentLibrarySidebar saga', () => {
    it('should done sagaInitDocumentLibrarySidebar', async () => {
      const dispatched = [];
      const thisState = clone(fakeState);
      thisState.documentLibrary[stateId].rootId = rootId;
      thisState.documentLibrary[stateId].typeRef = typeRef;

      const unfoldedItems = ['unfoldedItem1', 'unfoldedItem2', 'unfoldedItem3'];

      const getFolderTitleSpy = jest.spyOn(DocLibService, 'getFolderTitle').mockResolvedValue('Folder 1');
      const loadUnfoldedFoldersSpy = jest.spyOn(DocLibService, 'loadUnfoldedFolders').mockResolvedValue(unfoldedItems);
      const getChildrenDirsSpy = jest.spyOn(DocLibService, 'getChildrenDirs').mockResolvedValue([]);
      const removeUnfoldedItemSpy = jest.spyOn(DocLibService, 'removeUnfoldedItem').mockResolvedValue([]);

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => thisState
        },
        sagaInitDocumentLibrarySidebar,
        { stateId, w, logger }
      ).done;

      expect(getFolderTitleSpy).toHaveBeenCalledTimes(1);
      expect(getFolderTitleSpy).toHaveBeenCalledWith(rootId);

      expect(loadUnfoldedFoldersSpy).toHaveBeenCalledTimes(1);
      expect(loadUnfoldedFoldersSpy).toHaveBeenCalledWith(typeRef);

      expect(getChildrenDirsSpy).toHaveBeenCalledTimes(unfoldedItems.length);

      // remove all unfoldedItems, because getChildrenDirsSpy always returns mockResolvedValue([])
      expect(removeUnfoldedItemSpy).toHaveBeenCalledTimes(unfoldedItems.length);

      const setSidebarIsReadyActions = dispatched.filter(item => item.type === setSidebarIsReady().type);
      expect(setSidebarIsReadyActions.length).toBe(2);
      expect(setSidebarIsReadyActions[0].payload).toEqual(w(false));
      expect(setSidebarIsReadyActions[1].payload).toEqual(w(true));
    });
  });

  describe('sagaInitGroupActions saga', () => {
    it('should set empty group actions if no selected items', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        sagaInitGroupActions,
        { logger, stateId, w },
        { payload: [] }
      ).done;

      expect(dispatched[0]).toEqual(setGroupActions(w({})));
      expect(dispatched[1]).toEqual(setIsGroupActionsReady(w(true)));
    });

    it('should done sagaInitGroupActions', async () => {
      const dispatched = [];

      const selectedItems = ['item1', 'item2'];
      const actions = { forRecord: {}, forRecords: {}, forQuery: {} };
      const getRecordActionsSpy = jest.spyOn(JournalsService, 'getRecordActions').mockResolvedValue(actions);

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        sagaInitGroupActions,
        { logger, stateId, w, skipDelay: true },
        { payload: selectedItems }
      ).done;

      expect(dispatched[0]).toEqual(setIsGroupActionsReady(w(false)));
      expect(dispatched[dispatched.length - 1]).toEqual(setIsGroupActionsReady(w(true)));

      expect(getRecordActionsSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle exception', async () => {
      const dispatched = [];

      const selectedItems = ['item1', 'item2'];
      const getRecordActionsSpy = jest
        .spyOn(JournalsService, 'getRecordActions')
        .mockRejectedValue(new Error('JournalsService.getRecordActions error'));

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        sagaInitGroupActions,
        { logger, stateId, w, skipDelay: true },
        { payload: selectedItems }
      ).done;

      expect(getRecordActionsSpy).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);

      expect(dispatched[dispatched.length - 1]).toEqual(setIsGroupActionsReady(w(true)));
    });
  });

  describe('sagaExecGroupAction saga', () => {
    it('should done sagaExecGroupAction', async () => {
      const dispatched = [];
      const selected = ['selectedItem1', 'selectedItem2'];
      const thisState = clone(fakeState);
      thisState.documentLibrary[stateId] = { fileViewer: { selected } };

      const api = {
        recordActions: {
          executeAction: jest.fn().mockResolvedValue([])
        }
      };

      await runSaga(
        {
          dispatch: action => dispatched.push(action),
          getState: () => thisState
        },
        sagaExecGroupAction,
        {
          api,
          logger,
          stateId,
          w
        },
        { payload: {} }
      ).done;

      expect(api.recordActions.executeAction).toHaveBeenCalledTimes(1);
      expect(api.recordActions.executeAction).toHaveBeenCalledWith({ action: {}, records: selected });
    });

    it('should handle exception', async () => {
      const dispatched = [];

      await runSaga(
        {
          dispatch: action => dispatched.push(action)
        },
        sagaExecGroupAction,
        {
          api: {
            recordActions: {
              executeAction: jest.fn().mockRejectedValue(new Error('api.recordActions.executeAction error'))
            }
          },
          logger,
          stateId,
          w
        },
        { payload: {} }
      ).done;

      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });

  // @todo add tests for other docLib sagas
});
