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
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setGridInlineToolSettings,
  setJournalSetting,
  setJournalSettings,
  setPredicate,
  setColumnsSetup,
  setGrouping,
  setPreviewUrl,
  setUrl
} from '../actions/journals';
import { setLoading } from '../actions/loader';
import { t } from '../helpers/util';
import { JOURNAL_SETTING_ID_FIELD, JOURNAL_SETTING_DATA_FIELD } from '../components/Journals/constants';

const initialState = {
  loading: true,
  editorMode: false,

  url: {},

  grid: {
    data: [],
    columns: [],
    total: 0,
    createVariants: [],
    predicate: {},
    groupBy: null,
    sortBy: [],
    pagination: {
      skipCount: 0,
      maxItems: 10,
      page: 1
    },
    minHeight: null
  },

  journalsList: [],
  journals: [],
  journalSettings: [],

  config: null,
  initConfig: null,
  journalConfig: {
    meta: {},
    createVariants: []
  },

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
      Write: true,
      Delete: true
    }
  },

  selectedRecords: [],
  selectAllRecords: false,
  selectAllRecordsVisible: false,

  inlineToolSettings: {
    height: 0,
    top: 0,
    left: 0,
    row: {}
  },

  previewUrl: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setUrl]: (state, action) => {
      return {
        ...state,
        url: {
          ...state.url,
          ...action.payload
        }
      };
    },
    [setPredicate]: (state, action) => {
      return {
        ...state,
        predicate: action.payload
      };
    },
    [setPreviewUrl]: (state, action) => {
      return {
        ...state,
        previewUrl: action.payload
      };
    },
    [setColumnsSetup]: (state, action) => {
      return {
        ...state,
        columnsSetup: action.payload
      };
    },
    [setGrouping]: (state, action) => {
      return {
        ...state,
        grouping: action.payload
      };
    },
    [setJournalSettings]: (state, action) => {
      return {
        ...state,
        journalSettings: [
          {
            [JOURNAL_SETTING_ID_FIELD]: '',
            [JOURNAL_SETTING_DATA_FIELD]: { title: t('journals.default') },
            notRemovable: true
          },
          ...Array.from(action.payload)
        ]
      };
    },
    [setJournalSetting]: (state, action) => {
      return {
        ...state,
        journalSetting: {
          ...state.journalSetting,
          ...action.payload
        }
      };
    },
    [setGridInlineToolSettings]: (state, action) => {
      return {
        ...state,
        inlineToolSettings: action.payload
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
        config: {
          ...state.config,
          journalSettingId: action.payload
        }
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
        grid: {
          ...state.grid,
          ...action.payload
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
