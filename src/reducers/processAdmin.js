import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  getAllVersions,
  setAllVersions,
  getMetaInfo,
  setMetaInfo,
  getActionsInfo,
  setActionsInfo,
  getJournalTabInfo,
  setJournalTabInfo,
  setJournalTabInfoPage,
  setJournalTabInfoFilters,
  setJournalTabInfoSortBy
} from '../actions/processAdmin';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

/**
 * Process ID -- is the key
 *
 * Example:
 * [process-id]: {
 *  metaInfo: {
 *    loading: false,
 *    modifier: 'admin',
 *    ...
 *  },
 *  versions: {
 *   loading: false,
 *   data: [...]
 *  },
 *  INSTANCES: {
 *     loading: false,
 *     page: {
 *      ...
 *     },
 *     filters: [
 *       { ... }
 *     ],
 *     sortBy: [
 *       { ... }
 *     ],
 *     data: [...]
 *  },
 *  INCIDENTS: {
 *     loading: false,
 *     page: {
 *      ...
 *     },
 *     filters: [
 *       { ... }
 *     ],
 *     sortBy: [
 *       { ... }
 *     ],
 *     data: [...]
 *   }
 * }
 */
export const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [getAllVersions]: (state, action) => {
      const { processId } = action.payload;
      const processState = state[processId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          versions: {
            loading: true
          }
        }
      };
    },
    [setAllVersions]: (state, action) => {
      const { processId, versions } = action.payload;
      const processState = state[processId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          versions: {
            loading: false,
            data: versions
          }
        }
      };
    },

    [getMetaInfo]: (state, action) => {
      const { processId } = action.payload;
      const processState = state[processId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          metaInfo: {
            loading: true
          }
        }
      };
    },
    [setMetaInfo]: (state, action) => {
      const { processId, metaInfo } = action.payload;
      const processState = state[processId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          metaInfo: {
            loading: false,
            ...metaInfo
          }
        }
      };
    },

    [getActionsInfo]: (state, action) => {
      const { processId } = action.payload;
      const processState = state[processId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          actionsInfo: {
            data: [],
            loading: true
          }
        }
      };
    },
    [setActionsInfo]: (state, action) => {
      const { processId, actions } = action.payload;
      const processState = state[processId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          actionsInfo: {
            data: actions,
            loading: false
          }
        }
      };
    },

    [getJournalTabInfo]: (state, action) => {
      const { processId, tabId } = action.payload;
      const processState = state[processId] || {};
      const processTabState = processState[tabId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          [tabId]: {
            ...processTabState,
            loading: true,
            page: processTabState.page ? processTabState.page : DEFAULT_PAGINATION
          }
        }
      };
    },
    [setJournalTabInfo]: (state, action) => {
      const { processId, tabId, data, totalCount } = action.payload;
      const processState = state[processId] || {};
      const processTabState = processState[tabId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          [tabId]: {
            ...processTabState,
            loading: false,
            totalCount,
            data
          }
        }
      };
    },
    [setJournalTabInfoPage]: (state, action) => {
      const { processId, tabId, page } = action.payload;
      const processState = state[processId] || {};
      const processTabState = processState[tabId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          [tabId]: {
            ...processTabState,
            page
          }
        }
      };
    },
    [setJournalTabInfoFilters]: (state, action) => {
      const { processId, tabId, filters } = action.payload;
      const processState = state[processId] || {};
      const processTabState = processState[tabId] || {};

      return {
        ...state,
        [processId]: {
          ...processState,
          [tabId]: {
            ...processTabState,
            filters: Array.from(filters)
          }
        }
      };
    },
    [setJournalTabInfoSortBy]: (state, action) => {
      const { processId, tabId, sortBy } = action.payload;
      const processState = state[processId] || {};
      const processTabState = processState[tabId] || {};
      const stateSortBy = processTabState.sortBy || [];
      const columnSortByIndex = stateSortBy.findIndex(item => get(item, 'column.attribute') === get(sortBy, 'column.attribute'));

      if (columnSortByIndex !== -1) {
        stateSortBy.splice(columnSortByIndex, 1, sortBy);
      } else {
        stateSortBy.push(sortBy);
      }

      return {
        ...state,
        [processId]: {
          ...processState,
          [tabId]: {
            ...processTabState,
            sortBy: Array.from(stateSortBy)
          }
        }
      };
    }
  },
  initialState
);
