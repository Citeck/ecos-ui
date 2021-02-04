import { handleActions } from 'redux-actions';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import {
  initState,
  runSearch,
  setColumnsSetup,
  setCustomJournal,
  setCustomJournalMode,
  setDashletConfig,
  setEditorMode,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournals,
  setJournalSetting,
  setJournalSettings,
  setJournalsItem,
  setJournalsList,
  setOnlyLinked,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setRecordRef,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords,
  setSettingItem,
  setUrl,
  setSelectedJournals
} from '../actions/journals';
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
} from '../actions/docLib';
import { setLoading } from '../actions/loader';
import { t } from '../helpers/util';
import { handleAction, handleState } from '../helpers/redux';
import {
  DEFAULT_INLINE_TOOL_SETTINGS,
  DEFAULT_PAGINATION,
  JOURNAL_DASHLET_CONFIG_VERSION,
  JOURNAL_SETTING_DATA_FIELD,
  JOURNAL_SETTING_ID_FIELD
} from '../components/Journals/constants';
import { DEFAULT_DOCLIB_PAGINATION } from '../constants/docLib';

export const defaultState = {
  loading: true,
  editorMode: false,

  url: {},

  grid: {
    data: [],
    columns: [],
    total: 0,
    createVariants: [],
    predicate: {},
    groupBy: [],
    sortBy: [],
    pagination: DEFAULT_PAGINATION,
    minHeight: null,
    editingRules: {},
    search: ''
  },

  journalsList: [],
  journals: [],
  journalSettings: [],

  config: null,
  initConfig: null,
  journalConfig: {
    meta: { createVariants: [] }
  },
  recordRef: null,

  predicate: null,
  columnsSetup: {
    columns: [],
    sortBy: []
  },
  grouping: {
    columns: [],
    groupBy: []
  },

  journalSetting: {
    title: '',
    sortBy: [],
    groupBy: [],
    columns: [],
    predicate: null,
    permissions: {
      Write: true
      // Delete: true
    }
  },

  selectedRecords: [],
  selectAllRecords: false,
  selectAllRecordsVisible: false,

  inlineToolSettings: DEFAULT_INLINE_TOOL_SETTINGS,

  previewUrl: '',
  previewFileName: '',
  zipNodeRef: null,

  isLoadingPerformGroupActions: false,
  performGroupActionResponse: [],

  documentLibrary: {
    isEnabled: false,
    typeRef: null,
    fileTypeRefs: [],
    dirTypeRef: null,
    rootId: null,
    folderId: null,
    folderTitle: '',
    folderPath: [],
    searchText: '',
    createVariants: [],
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
  },

  selectedJournals: []
};

const initialState = {};
const updateConfig = (config, data = {}) => ({
  ...config,
  [JOURNAL_DASHLET_CONFIG_VERSION]: {
    ...get(config, [JOURNAL_DASHLET_CONFIG_VERSION], {}),
    ...data
  }
});

Object.freeze(initialState);
Object.freeze(defaultState);

export default handleActions(
  {
    [initState]: (state, action) => {
      const id = action.payload;

      return {
        ...state,
        [id]: { ...cloneDeep(defaultState), ...(state[id] || {}) }
      };
    },
    [setUrl]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              url: {
                ...action.payload
              }
            }
          }
        : {
            ...state,
            url: {
              ...action.payload
            }
          };
    },
    [setPredicate]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { predicate: action.payload });
    },
    [setPreviewUrl]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { previewUrl: action.payload });
    },
    [setPreviewFileName]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { previewFileName: action.payload });
    },
    [setColumnsSetup]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { columnsSetup: action.payload });
    },
    [setGrouping]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { grouping: action.payload });
    },
    [setJournalSettings]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        journalSettings: [
          {
            [JOURNAL_SETTING_ID_FIELD]: '',
            [JOURNAL_SETTING_DATA_FIELD]: { title: t('journals.default') },
            notRemovable: true
          },
          ...Array.from(action.payload)
        ]
      });
    },
    [setJournalSetting]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              journalSetting: {
                ...(state[stateId] || {}).journalSetting,
                ...action.payload
              },
              grid: {
                ...(state[stateId] || {}).grid,
                search: ''
              }
            }
          }
        : {
            ...state,
            journalSetting: {
              ...state.journalSetting,
              ...action.payload
            }
          };
    },
    [setGridInlineToolSettings]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        inlineToolSettings: action.payload,
        previewFileName: get(action.payload, ['row', 'cm:title'], '')
      });
    },
    [setJournalsItem]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig((state[stateId] || {}).config, {
                journalId: action.payload.nodeRef,
                journalType: action.payload.type
              })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, {
              journalId: action.payload.nodeRef,
              journalType: action.payload.type
            })
          };
    },
    [setSettingItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const config = get(state, [stateId, 'config'], {});

      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig(config, { journalSettingId: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { journalSettingId: action.payload })
          };
    },
    [setCustomJournal]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig((state[stateId] || {}).config, { customJournal: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { customJournal: action.payload })
          };
    },
    [setOnlyLinked]: (state, action) => {
      const stateId = action.payload.stateId;
      const config = get(state, [stateId, 'config'], {});

      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig(config, { onlyLinked: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { onlyLinked: action.payload })
          };
    },
    [setCustomJournalMode]: (state, action) => {
      const stateId = action.payload.stateId;
      const config = get(state, [stateId, 'config'], {});

      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              config: updateConfig(config, { customJournalMode: action.payload })
            }
          }
        : {
            ...state,
            config: updateConfig(state.config, { customJournalMode: action.payload })
          };
    },
    [setEditorMode]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { editorMode: action.payload });
    },
    [setJournalsList]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { journalsList: action.payload });
    },
    [setJournals]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { journals: action.payload });
    },
    [setGrid]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return stateId
        ? {
            ...state,
            [stateId]: {
              ...(state[stateId] || {}),
              grid: {
                ...(state[stateId] || {}).grid,
                ...action.payload
              }
            }
          }
        : {
            ...state,
            grid: {
              ...state.grid,
              ...action.payload
            }
          };
    },
    [setDashletConfig]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { initConfig: action.payload, config: action.payload });
    },
    [setJournalConfig]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { journalConfig: action.payload });
    },
    [setSelectedRecords]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectedRecords: action.payload });
    },
    [setSelectAllRecords]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectAllRecords: action.payload });
    },
    [setSelectAllRecordsVisible]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { selectAllRecordsVisible: action.payload });
    },
    [setLoading]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { loading: action.payload });
    },
    [setRecordRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, { recordRef: action.payload });
    },
    [runSearch]: (state, action) => {
      const stateId = action.payload.stateId;

      return handleState(state, stateId, {
        grid: {
          ...(state[stateId] || {}).grid,
          search: action.payload.text,
          sortBy: [],
          groupBy: [],
          pagination: {
            ...(state[stateId] || {}).grid.pagination,
            skipCount: 0,
            page: 1
          }
        }
      });
    },
    [setIsDocLibEnabled]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          isEnabled: action.payload
        }
      });
    },
    [setTypeRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          typeRef: action.payload
        }
      });
    },
    [setFileTypeRefs]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          fileTypeRefs: Array.isArray(action.payload) ? action.payload : []
        }
      });
    },
    [setDirTypeRef]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          dirTypeRef: action.payload
        }
      });
    },
    [setCreateVariants]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          createVariants: Array.isArray(action.payload) ? action.payload : []
        }
      });
    },
    [setRootId]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          rootId: action.payload
        }
      });
    },
    [setFolderId]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          folderId: handledAction.payload
        }
      });
    },
    [setFolderTitle]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          folderTitle: handledAction.payload
        }
      });
    },
    [setFolderPath]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          folderPath: Array.isArray(handledAction.payload) ? handledAction.payload : []
        }
      });
    },
    [setSearchText]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...state[stateId].documentLibrary,
          searchText: handledAction.payload
        }
      });
    },
    [setSidebarItems]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            items: action.payload
          }
        }
      });
    },
    [addSidebarItems]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      action = handleAction(action);

      const resultItems = cloneDeep(documentLibrary.sidebar.items);
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
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            items: resultItems
          }
        }
      });
    },
    [setSidebarIsReady]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            isReady: action.payload
          }
        }
      });
    },
    [setSidebarError]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            hasError: action.payload
          }
        }
      });
    },
    [foldSidebarItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            items: documentLibrary.sidebar.items.map(item => {
              if (item.id !== handledAction.payload) {
                return item;
              }
              return { ...item, isUnfolded: false };
            })
          }
        }
      });
    },
    [unfoldSidebarItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            items: documentLibrary.sidebar.items.map(item => {
              if (item.id !== handledAction.payload) {
                return item;
              }
              return { ...item, isUnfolded: true };
            })
          }
        }
      });
    },
    [updateSidebarItem]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      action = handleAction(action);

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          sidebar: {
            ...documentLibrary.sidebar,
            items: documentLibrary.sidebar.items.map(item => {
              if (item.id !== action.payload.id) {
                return item;
              }
              return { ...item, ...action.payload };
            })
          }
        }
      });
    },
    [setFileViewerIsReady]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            isReady: handledAction.payload
          }
        }
      });
    },
    [setFileViewerItems]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            items: handledAction.payload
          }
        }
      });
    },
    [setFileViewerError]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            hasError: handledAction.payload
          }
        }
      });
    },
    [setFileViewerPagination]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            pagination: {
              ...documentLibrary.fileViewer.pagination,
              ...handledAction.payload
            }
          }
        }
      });
    },
    [setFileViewerTotal]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            total: handledAction.payload
          }
        }
      });
    },
    [setFileViewerSelected]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            selected: Array.isArray(handledAction.payload) ? handledAction.payload : []
          }
        }
      });
    },
    [setFileViewerLastClicked]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          fileViewer: {
            ...documentLibrary.fileViewer,
            lastClicked: handledAction.payload
          }
        }
      });
    },
    [setIsGroupActionsReady]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          groupActions: {
            ...documentLibrary.groupActions,
            isReady: handledAction.payload
          }
        }
      });
    },
    [setGroupActions]: (state, action) => {
      const stateId = action.payload.stateId;
      const documentLibrary = state[stateId].documentLibrary;
      const handledAction = handleAction(cloneDeep(action));

      return handleState(state, stateId, {
        documentLibrary: {
          ...documentLibrary,
          groupActions: {
            ...documentLibrary.groupActions,
            forRecords: handledAction.payload.forRecords || {},
            forQuery: handledAction.payload.forQuery || {}
          }
        }
      });
    },
    [setSelectedJournals]: (state, action) => {
      const stateId = action.payload.stateId;
      const handledAction = handleAction(action);

      return handleState(state, stateId, {
        selectedJournals: handledAction.payload
      });
    }
  },
  initialState
);
