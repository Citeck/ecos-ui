import { handleActions } from 'redux-actions';
import {
  setDashletIsReady,
  setDashletEditorVisible,
  setJournalsList,
  setJournals,
  setGrid,
  setDashletConfig,
  setJournalsListItem,
  setJournalsItem,
  setSettingItem,
  setJournalConfig
} from '../actions/journals';

const initialState = {
  dashletIsReady: false,
  editorVisible: true,
  journalsList: [],
  journals: [],
  settings: [],
  gridData: {
    data: [],
    columns: [],
    total: 0
  },
  config: null,
  initConfig: null,
  page: {
    skipCount: 10,
    maxItems: 10
  },
  journalConfig: null
};

Object.freeze(initialState);

export default handleActions(
  {
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
    [setDashletIsReady]: (state, action) => {
      return {
        ...state,
        dashletIsReady: action.payload
      };
    },
    [setDashletEditorVisible]: (state, action) => {
      return {
        ...state,
        editorVisible: action.payload
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
    }
  },
  initialState
);
