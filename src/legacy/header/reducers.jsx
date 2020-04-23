import { combineReducers } from 'redux';
import {
  CREATE_CASE_WIDGET_SET_ITEMS,
  CREATE_CASE_WIDGET_SET_IS_CASCADE,
  USER_SET_PHOTO,
  USER_SET_FULLNAME,
  SITE_MENU_SET_SITE_MENU_ITEMS,
  USER_MENU_SET_ITEMS,
  SHOW_MODAL,
  HIDE_MODAL,
  SEARCH_AUTOCOMPLETE_VISIBILITY_TOGGLE,
  SEARCH_AUTOCOMPLETE_UPDATE_RESULTS,
  SEARCH_AUTOCOMPLETE_UPDATE_DOCUMENTS_RESULTS,
  SEARCH_SET_LAST_SEARCH_INDEX,
  VIEW_SET_IS_MOBILE
} from './actions';

/* caseMenuReducer */
const caseMenuInitialState = {
  isCascade: false,
  items: []
};

Object.freeze(caseMenuInitialState);

function caseMenuReducer(state = caseMenuInitialState, action) {
  switch (action.type) {
    case CREATE_CASE_WIDGET_SET_ITEMS:
      return {
        ...state,
        items: action.payload
      };

    case CREATE_CASE_WIDGET_SET_IS_CASCADE:
      return {
        ...state,
        isCascade: action.payload
      };

    default:
      return state;
  }
}

/* userMenuReducer */
const userMenuInitialState = {
  items: []
};

Object.freeze(userMenuInitialState);

function userMenuReducer(state = userMenuInitialState, action) {
  switch (action.type) {
    case USER_MENU_SET_ITEMS:
      return {
        ...state,
        items: action.payload
      };

    default:
      return state;
  }
}

/* userReducer */
const userInitialState = {
  fullName: '',
  photo: ''
};

Object.freeze(userInitialState);

function userReducer(state = userInitialState, action) {
  switch (action.type) {
    case USER_SET_FULLNAME:
      return {
        ...state,
        fullName: action.payload
      };

    case USER_SET_PHOTO:
      return {
        ...state,
        photo: action.payload
      };

    default:
      return state;
  }
}

/* siteMenuReducer */
const siteMenuInitialState = {
  items: []
};

Object.freeze(siteMenuInitialState);

function siteMenuReducer(state = siteMenuInitialState, action) {
  switch (action.type) {
    case SITE_MENU_SET_SITE_MENU_ITEMS:
      return {
        ...state,
        items: action.payload
      };

    default:
      return state;
  }
}

/* modalReducer */
const modalInitialState = {
  isOpen: false,
  title: '',
  content: '',
  onCloseCallback: null,
  buttons: []
};

/*
Button list example:
buttons: [
    {
        label: 'Button label',
        onClick: () => {
            ...some actions
        },
        bsStyle: "primary",
        isCloseButton: false
    },
    ...other buttons
]
 */

Object.freeze(modalInitialState);

function modalReducer(state = modalInitialState, action) {
  switch (action.type) {
    case SHOW_MODAL:
      return {
        ...state,
        isOpen: true,
        ...action.payload
      };

    case HIDE_MODAL:
      return modalInitialState;

    default:
      return state;
  }
}

/* searchReducer */
const searchInitialState = {
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
};

Object.freeze(searchInitialState);

function searchReducer(state = searchInitialState, action) {
  const payload = action.payload;

  switch (action.type) {
    case SEARCH_AUTOCOMPLETE_VISIBILITY_TOGGLE:
      return {
        ...state,
        autocomplete: {
          ...state.autocomplete,
          isVisible: action.payload
        }
      };

    case SEARCH_AUTOCOMPLETE_UPDATE_RESULTS:
      return {
        ...state,
        autocomplete: {
          ...state.autocomplete,
          documents: {
            hasMoreRecords: payload.documents.hasMoreRecords,
            items: payload.documents.items
          },
          sites: {
            items: payload.sites.items
          },
          people: {
            items: payload.people.items
          }
        }
      };

    case SEARCH_AUTOCOMPLETE_UPDATE_DOCUMENTS_RESULTS:
      return {
        ...state,
        autocomplete: {
          ...state.autocomplete,
          documents: {
            hasMoreRecords: payload.hasMoreRecords,
            items: state.autocomplete.documents.items.concat(payload.items)
          }
        }
      };

    case SEARCH_SET_LAST_SEARCH_INDEX:
      return {
        ...state,
        lastSearchIndex: payload
      };

    default:
      return state;
  }
}

/* viewReducer */
const viewInitialState = {
  isMobile: false
};

Object.freeze(viewInitialState);

function viewReducer(state = viewInitialState, action) {
  switch (action.type) {
    case VIEW_SET_IS_MOBILE:
      return {
        ...state,
        isMobile: action.payload
      };

    default:
      return state;
  }
}

/* root reducer */
export default combineReducers({
  caseMenu: caseMenuReducer,
  siteMenu: siteMenuReducer,
  modal: modalReducer,
  search: searchReducer,
  userMenu: userMenuReducer,
  user: userReducer,
  view: viewReducer
});
