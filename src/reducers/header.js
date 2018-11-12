import { handleActions } from 'redux-actions';
import {
  setCreateCaseWidgetItems,
  setCreateCaseWidgetIsCascade,
  toggleAutocompleteVisibility,
  updateAutocompleteResults,
  updateAutocompleteDocumentsResults,
  setLastSearchIndex,
  setUserMenuItems,
  setSiteMenuItems
} from '../actions/header';

const initialState = {
  createCaseWidget: {
    isCascade: false,
    items: []
  },
  search: {
    lastSearchIndex: null,
    autocomplete: {
      isVisible: false,
      documents: {
        hasMoreRecords: false,
        items: []
      },
      sites: {
        items: []
      },
      people: {
        items: []
      }
    }
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
    /* search */
    [toggleAutocompleteVisibility]: (state, action) => {
      return {
        ...state,
        search: {
          ...state.search,
          autocomplete: {
            ...state.search.autocomplete,
            isVisible: action.payload
          }
        }
      };
    },
    [updateAutocompleteResults]: (state, action) => {
      return {
        ...state,
        search: {
          ...state.search,
          autocomplete: {
            ...state.search.autocomplete,
            documents: {
              hasMoreRecords: action.payload.documents.hasMoreRecords,
              items: action.payload.documents.items
            },
            sites: {
              items: action.payload.sites.items
            },
            people: {
              items: action.payload.people.items
            }
          }
        }
      };
    },
    [updateAutocompleteDocumentsResults]: (state, action) => {
      return {
        ...state,
        search: {
          ...state.search,
          autocomplete: {
            ...state.search.autocomplete,
            documents: {
              hasMoreRecords: action.payload.hasMoreRecords,
              items: state.search.autocomplete.documents.items.concat(action.payload.items)
            }
          }
        }
      };
    },
    [setLastSearchIndex]: (state, action) => {
      return {
        ...state,
        search: {
          ...state.search,
          lastSearchIndex: action.payload
        }
      };
    },
    /* userMenu */
    [setUserMenuItems]: (state, action) => {
      return {
        ...state,
        userMenu: {
          ...state.userMenu,
          items: action.payload
        }
      };
    },
    /* siteMenu */
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
