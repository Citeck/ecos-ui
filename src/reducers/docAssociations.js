import { handleActions } from 'redux-actions';
import { getDocuments, initStore, setAllowedConnections, setDocuments, getMenu, setMenu, setSectionList } from '../actions/docAssociations';

export const initialState = {
  // список разделов
  sectionList: [],
  // список документов, рассортированный по связям
  documents: [],
  // список доступных связей (первый уровень меню)
  allowedConnections: [],
  // меню-выпадашка (состоит из 3х уровней)
  menu: [],
  isLoading: false,
  isLoadingMenu: false,
  documentsTotalCount: 0
};

Object.freeze(initialState);

export default handleActions(
  {
    [initStore]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload]) {
        ownState = { ...ownState, ...state[payload] };
      }

      return {
        ...state,
        [payload]: { ...ownState }
      };
    },

    [setSectionList]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        sectionList: payload.sectionList
      }
    }),

    [setDocuments]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        documents: payload.documents,
        documentsTotalCount: payload.documentsTotalCount,
        isLoading: false
      }
    }),
    [getDocuments]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: true
      }
    }),

    [setAllowedConnections]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        allowedConnections: payload.allowedConnections
      }
    }),

    [getMenu]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoadingMenu: true
      }
    }),
    [setMenu]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        menu: payload.menu,
        isLoadingMenu: false
      }
    })
  },
  {}
);
