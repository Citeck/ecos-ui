import { handleActions } from 'redux-actions';
import { getDocuments, initStore, setAllowedConnections, setDocuments, setMenu, setSectionList } from '../actions/docAssociations';

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
  documentsTotalCount: 0
};

Object.freeze(initialState);

export default handleActions(
  {
    [initStore]: (state, action) => {
      let ownState = { ...initialState };

      if (state[action.payload]) {
        ownState = { ...ownState, ...state[action.payload] };
      }

      return {
        ...state,
        [action.payload]: { ...ownState }
      };
    },

    [setSectionList]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        sectionList: action.payload.sectionList
      }
    }),

    [setDocuments]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        documents: action.payload.documents,
        documentsTotalCount: action.payload.documentsTotalCount,
        isLoading: false
      }
    }),
    [getDocuments]: (state, action) => ({
      ...state,
      [action.payload]: {
        ...state[action.payload],
        isLoading: true
      }
    }),

    [setAllowedConnections]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        allowedConnections: action.payload.allowedConnections
      }
    }),

    [setMenu]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        menu: action.payload.menu
      }
    })
  },
  {}
);
