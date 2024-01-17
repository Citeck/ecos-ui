import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  getMetaInfo,
  setMetaInfo,
  getActionsInfo,
  setActionsInfo,
  getJournalTabInfo,
  setJournalTabInfo,
  setJournalTabInfoFilters,
  setJournalTabInfoPage,
  setJournalTabInfoSortBy
} from '../actions/instanceAdmin';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

export const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [getMetaInfo]: (state, action) => {
      const { instanceId } = action.payload;
      const instanceState = state[instanceId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          metaInfo: {
            loading: true
          }
        }
      };
    },
    [setMetaInfo]: (state, action) => {
      const { instanceId, metaInfo } = action.payload;
      const instanceState = state[instanceId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          metaInfo: {
            loading: false,
            ...metaInfo
          }
        }
      };
    },

    [getActionsInfo]: (state, action) => {
      const { instanceId } = action.payload;
      const instanceState = state[instanceId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          actionsInfo: {
            data: [],
            loading: true
          }
        }
      };
    },
    [setActionsInfo]: (state, action) => {
      const { instanceId, actions } = action.payload;
      const instanceState = state[instanceId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          actionsInfo: {
            data: actions,
            loading: false
          }
        }
      };
    },

    [getJournalTabInfo]: (state, action) => {
      const { instanceId, tabId } = action.payload;
      const instanceState = state[instanceId] || {};
      const instanceTabState = instanceState[tabId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          [tabId]: {
            ...instanceTabState,
            loading: true,
            page: instanceTabState.page ? instanceTabState.page : DEFAULT_PAGINATION
          }
        }
      };
    },
    [setJournalTabInfo]: (state, action) => {
      const { instanceId, tabId, data, totalCount } = action.payload;
      const instanceState = state[instanceId] || {};
      const instanceTabState = instanceState[tabId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          [tabId]: {
            ...instanceTabState,
            loading: false,
            totalCount,
            data
          }
        }
      };
    },
    [setJournalTabInfoPage]: (state, action) => {
      const { instanceId, tabId, page } = action.payload;
      const instanceState = state[instanceId] || {};
      const instanceTabState = instanceState[tabId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          [tabId]: {
            ...instanceTabState,
            page
          }
        }
      };
    },
    [setJournalTabInfoFilters]: (state, action) => {
      const { instanceId, tabId, filters } = action.payload;
      const instanceState = state[instanceId] || {};
      const instanceTabState = instanceState[tabId] || {};

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          [tabId]: {
            ...instanceTabState,
            filters: Array.from(filters)
          }
        }
      };
    },
    [setJournalTabInfoSortBy]: (state, action) => {
      const { instanceId, tabId, sortBy } = action.payload;
      const instanceState = state[instanceId] || {};
      const instanceTabState = instanceState[tabId] || {};
      const stateSortBy = instanceTabState.sortBy || [];
      const columnSortByIndex = stateSortBy.findIndex(item => get(item, 'column.attribute') === get(sortBy, 'column.attribute'));

      if (columnSortByIndex !== -1) {
        stateSortBy.splice(columnSortByIndex, 1, sortBy);
      } else {
        stateSortBy.push(sortBy);
      }

      return {
        ...state,
        [instanceId]: {
          ...instanceState,
          [tabId]: {
            ...instanceTabState,
            sortBy: Array.from(stateSortBy)
          }
        }
      };
    }
  },
  initialState
);
