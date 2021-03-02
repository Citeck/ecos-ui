import { handleActions } from 'redux-actions';
import {
  fetchCreateCaseWidgetData,
  resetSearchAutocompleteItems,
  runSearchAutocompleteItems,
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
    isLoading: false,
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
    [fetchCreateCaseWidgetData]: (state, action) => {
      return {
        ...state,
        createCaseWidget: { ...initialState.createCaseWidget }
      };
    },
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

    [runSearchAutocompleteItems]: (state, action) => {
      return {
        ...state,
        search: {
          ...state.search,
          isLoading: true
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
          noResults,
          isLoading: false
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
          noResults: false,
          isLoading: false
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
