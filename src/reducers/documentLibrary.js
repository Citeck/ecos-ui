import { handleActions } from 'redux-actions';
import cloneDeep from 'lodash/cloneDeep';

import { handleAction, handleState, updateState } from '../helpers/redux';
import { DEFAULT_DOCLIB_PAGINATION } from '../constants/docLib';
import {
  addSidebarItems,
  foldSidebarItem,
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
  setRootId,
  setSearchText,
  setSidebarError,
  setSidebarIsReady,
  setSidebarItems,
  setTypeRef,
  unfoldSidebarItem,
  updateSidebarItem
} from '../actions/docLib';

const initialState = {};

export const defaultState = Object.freeze({
  isEnabled: false,
  isLoading: true,
  typeRef: null,
  fileTypeRefs: [],
  dirTypeRef: null,
  rootId: null,
  folderId: null,
  folderTitle: '',
  folderPath: [],
  searchText: '',
  createVariants: [],
  canUploadFiles: false,
  groupActions: {
    isReady: true,
    forRecords: {},
    forQuery: {}
  },
  sidebar: {
    isReady: false,
    items: [],
    hasError: false
  },
  fileViewer: {
    isReady: false,
    items: [],
    selected: [],
    lastClicked: null,
    total: 0,
    pagination: DEFAULT_DOCLIB_PAGINATION,
    hasError: false
  }
});

export default handleActions(
  {
    [setIsDocLibEnabled]: (state, action) => {
      const stateId = action.payload.stateId;
      const isLoading = state[stateId].isLoading;
      action = handleAction(action);
      const isEnabled = action.payload;

      return updateState(state, stateId, { isEnabled, isLoading: isEnabled && isLoading }, defaultState);
    },
    [setTypeRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        typeRef: action.payload
      });
    },
    [setFileTypeRefs]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        fileTypeRefs: Array.isArray(action.payload) ? action.payload : []
      });
    },
    [setDirTypeRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        dirTypeRef: action.payload
      });
    },
    [setCreateVariants]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        createVariants: Array.isArray(action.payload) ? action.payload : []
      });
    },
    [setCanUploadFiles]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        canUploadFiles: action.payload
      });
    },
    [setRootId]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        rootId: action.payload
      });
    },
    [setFolderId]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        folderId: handledAction.payload
      });
    },
    [setFolderTitle]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        folderTitle: handledAction.payload
      });
    },
    [setFolderPath]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        folderPath: Array.isArray(handledAction.payload) ? handledAction.payload : []
      });
    },
    [setSearchText]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        searchText: handledAction.payload
      });
    },
    [setSidebarItems]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          items: action.payload
        }
      });
    },
    [addSidebarItems]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      action = handleAction(action);

      const resultItems = cloneDeep(sidebar.items);
      const addItems = Array.isArray(action.payload) ? action.payload : [];

      for (let i = 0; i < addItems.length; i++) {
        const newItem = addItems[i];
        const newItemId = newItem.id;
        const index = resultItems.findIndex(item => item.id === newItemId);
        if (index === -1) {
          resultItems.push(newItem);
        } else {
          resultItems[index] = { ...resultItems[index], ...newItem };
        }
      }

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          items: resultItems
        }
      });
    },
    [setSidebarIsReady]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          isReady: action.payload
        }
      });
    },
    [setSidebarError]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          hasError: action.payload
        }
      });
    },
    [foldSidebarItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          items: sidebar.items.map(item => {
            if (item.id !== handledAction.payload) {
              return item;
            }
            return { ...item, isUnfolded: false };
          })
        }
      });
    },
    [unfoldSidebarItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          items: sidebar.items.map(item => {
            if (item.id !== handledAction.payload) {
              return item;
            }
            return { ...item, isUnfolded: true };
          })
        }
      });
    },
    [updateSidebarItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const sidebar = state[stateId].sidebar;
      action = handleAction(action);

      return handleState(state, stateId, {
        ...state[stateId],
        sidebar: {
          ...sidebar,
          items: sidebar.items.map(item => {
            if (item.id !== action.payload.id) {
              return item;
            }
            return { ...item, ...action.payload };
          })
        }
      });
    },
    [setFileViewerIsReady]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          isReady: handledAction.payload
        }
      });
    },
    [setFileViewerItems]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          items: handledAction.payload
        }
      });
    },
    [setFileViewerError]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          hasError: handledAction.payload
        }
      });
    },
    [setFileViewerPagination]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          pagination: {
            ...fileViewer.pagination,
            ...handledAction.payload
          }
        }
      });
    },
    [setFileViewerTotal]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          total: handledAction.payload
        }
      });
    },
    [setFileViewerSelected]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          selected: Array.isArray(handledAction.payload) ? handledAction.payload : []
        }
      });
    },
    [setFileViewerLastClicked]: (state, action) => {
      const stateId = action.payload.stateId;
      const fileViewer = state[stateId].fileViewer;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        fileViewer: {
          ...fileViewer,
          lastClicked: handledAction.payload
        }
      });
    },
    [setFileViewerLoadingStatus]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        isLoading: handledAction.payload
      });
    },
    [setIsGroupActionsReady]: (state, action) => {
      const stateId = action.payload.stateId;
      const groupActions = state[stateId].groupActions;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        groupActions: {
          ...groupActions,
          isReady: handledAction.payload
        }
      });
    },
    [setGroupActions]: (state, action) => {
      const stateId = action.payload.stateId;
      const groupActions = state[stateId].groupActions;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        ...state[stateId],
        groupActions: {
          ...groupActions,
          forRecords: handledAction.payload.forRecords || {},
          forQuery: handledAction.payload.forQuery || {}
        }
      });
    }
  },
  initialState
);
