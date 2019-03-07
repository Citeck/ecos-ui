import { handleActions } from 'redux-actions';
import {
  setEditorMode,
  setJournalsList,
  setJournals,
  setGrid,
  setDashletConfig,
  setJournalsListItem,
  setJournalsItem,
  setSettingItem,
  setJournalConfig,
  setPage,
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setJournalsListName,
  setGridMinHeight
} from '../actions/journals';
import { setLoading } from '../actions/loader';

const MAX_ITEMS = 10;

const initialState = {
  loading: true,
  dashletIsReady: false,
  editorMode: false,
  journalsList: [],
  journals: [],
  settings: [],
  gridData: {
    data: Array.from(Array(MAX_ITEMS), (e, i) => ({ id: i })),
    columns: [{ dataField: '_', text: ' ', _isEmpty: true }],
    total: 0
  },
  config: null,
  initConfig: null,
  pagination: {
    skipCount: 0,
    maxItems: MAX_ITEMS,
    page: 1
  },
  journalConfig: null,
  selectedRecords: [],
  selectAllRecords: false,
  selectAllRecordsVisible: false,
  journalsListName: '',
  gridMinHeight: null
};

Object.freeze(initialState);

export default handleActions(
  {
    [setGridMinHeight]: (state, action) => {
      return {
        ...state,
        gridMinHeight: action.payload
      };
    },
    [setJournalsListName]: (state, action) => {
      return {
        ...state,
        journalsListName: action.payload
      };
    },
    [setJournalsListItem]: (state, action) => {
      return {
        ...state,
        config: {
          ...state.config,
          journalsListId: action.payload.id
        }
      };
    },
    [setJournalsItem]: (state, action) => {
      return {
        ...state,
        config: {
          ...state.config,
          journalId: action.payload.nodeRef,
          journalType: action.payload.type
        }
      };
    },
    [setSettingItem]: (state, action) => {
      return {
        ...state,
        config: [
          ...state.config,
          {
            settingsId: action.payload.id
          }
        ]
      };
    },
    [setEditorMode]: (state, action) => {
      return {
        ...state,
        editorMode: action.payload
      };
    },
    [setJournalsList]: (state, action) => {
      return {
        ...state,
        journalsList: action.payload
      };
    },
    [setJournals]: (state, action) => {
      return {
        ...state,
        journals: action.payload
      };
    },
    [setGrid]: (state, action) => {
      return {
        ...state,
        gridData: action.payload
      };
    },
    [setPage]: (state, action) => {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload
        }
      };
    },
    [setDashletConfig]: (state, action) => {
      return {
        ...state,
        initConfig: action.payload,
        config: action.payload
      };
    },
    [setJournalConfig]: (state, action) => {
      return {
        ...state,
        journalConfig: action.payload
      };
    },
    [setSelectedRecords]: (state, action) => {
      return {
        ...state,
        selectedRecords: action.payload
      };
    },
    [setSelectAllRecords]: (state, action) => {
      return {
        ...state,
        selectAllRecords: action.payload
      };
    },
    [setSelectAllRecordsVisible]: (state, action) => {
      return {
        ...state,
        selectAllRecordsVisible: action.payload
      };
    },
    [setLoading]: (state, action) => {
      return {
        ...state,
        loading: action.payload
      };
    }
  },
  initialState
);
