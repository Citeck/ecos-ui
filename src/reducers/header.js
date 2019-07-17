import { handleActions } from 'redux-actions';
import {
  resetSearchAutocompleteItems,
  setCreateCaseWidgetIsCascade,
  setCreateCaseWidgetItems,
  setSearchAutocompleteItems,
  setSiteMenuItems,
  setUserMenuItems
} from '../actions/header';

const initialState = {
  createCaseWidget: {
    isCascade: false,
    items: []
  },
  search: {
    documents: [],
    sites: [],
    people: [],
    noResults: false
  },
  siteMenu: {
    items: []
  },
  userMenu: {
    items: []
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [setCreateCaseWidgetItems]: (state, action) => {
      return {
        ...state,
        createCaseWidget: {
          ...state.createCaseWidget,
          items: action.payload
        }
      };
    },
    [setCreateCaseWidgetIsCascade]: (state, action) => {
      return {
        ...state,
        createCaseWidget: {
          ...state.createCaseWidget,
          isCascade: action.payload
        }
      };
    },

    [setSearchAutocompleteItems]: (state, action) => {
      const { documents, sites, people, noResults } = action.payload || {};

      return {
        ...state,
        search: {
          documents: documents.items || [],
          people: people.items || [],
          sites: sites.items || [],
          noResults
        }
      };
    },
    [resetSearchAutocompleteItems]: (state, action) => {
      return {
        ...state,
        search: {
          documents: [],
          people: [],
          sites: [],
          noResults: false
        }
      };
    },

    [setUserMenuItems]: (state, action) => {
      return {
        ...state,
        userMenu: {
          ...state.userMenu,
          items: action.payload
        }
      };
    },

    [setSiteMenuItems]: (state, action) => {
      return {
        ...state,
        siteMenu: {
          ...state.siteMenu,
          items: action.payload
        }
      };
    }
  },
  initialState
);
