import { createAction } from 'redux-actions';

const prefix = 'header/';

export const fetchCreateCaseWidgetData = createAction(prefix + 'CREATE_CASE_WIDGET_FETCH_DATA');
export const setCreateCaseWidgetItems = createAction(prefix + 'CREATE_CASE_WIDGET_SET_ITEMS');
export const setCreateCaseWidgetIsCascade = createAction(prefix + 'CREATE_CASE_WIDGET_SET_IS_CASCADE');

/* Search */
export const setLastSearchIndex = createAction(prefix + 'SEARCH_SET_LAST_SEARCH_INDEX');
export const toggleAutocompleteVisibility = createAction(prefix + 'SEARCH_AUTOCOMPLETE_VISIBILITY_TOGGLE');
export const updateAutocompleteResults = createAction(prefix + 'SEARCH_AUTOCOMPLETE_UPDATE_RESULTS');
export const updateAutocompleteDocumentsResults = createAction(prefix + 'SEARCH_AUTOCOMPLETE_UPDATE_DOCUMENTS_RESULTS');

export function getSearchTextFromHistory(isDesc, successCallback) {
  return (dispatch, getState, api) => {
    if (!('localStorage' in window && window.localStorage !== null)) {
      return null;
    }

    const localStorageData = localStorage.getItem('ALF_SEARCHBOX_HISTORY');
    if (!localStorageData) {
      return null;
    }

    const searchPhrases = JSON.parse(localStorageData);

    const state = getState();
    let lastSearchIndex = state.header.search.lastSearchIndex;

    if (isDesc) {
      // Up Arrow press
      if (lastSearchIndex === 0 || lastSearchIndex === null) {
        lastSearchIndex = searchPhrases.length - 1;
      } else {
        lastSearchIndex--;
      }
    } else {
      // Down Arrow press
      if (lastSearchIndex === searchPhrases.length - 1 || lastSearchIndex === null) {
        lastSearchIndex = 0;
      } else {
        lastSearchIndex++;
      }
    }

    dispatch(setLastSearchIndex(lastSearchIndex));
    typeof successCallback === 'function' && successCallback(searchPhrases[lastSearchIndex]);
  };
}

export function fetchAutocompleteItems(payload, successCallback) {
  return (dispatch, getState, { api, logger }) => {
    const initState = {
      documents: { items: [], hasMoreRecords: false },
      sites: { items: [] },
      people: { items: [] }
    };

    if (payload.length < 2) {
      dispatch(updateAutocompleteResults(initState));
      return;
    }

    let promises = [
      api.menu.getLiveSearchDocuments(payload, 0),
      api.menu.getLiveSearchSites(payload),
      api.menu.getLiveSearchPeople(payload)
    ];

    Promise.all(promises)
      .then(([documents, sites, people]) => {
        dispatch(updateAutocompleteResults({ documents, sites, people }));
        typeof successCallback === 'function' && successCallback();
      })
      .catch(e => {
        logger.error('[fetchAutocompleteItems action] error', e.message);
        dispatch(updateAutocompleteResults(initState));
        typeof successCallback === 'function' && successCallback();
      });
  };
}

export function fetchMoreAutocompleteDocuments(payload) {
  return (dispatch, getState, { api, logger }) => {
    const state = getState();
    const documentsQty = state.header.search.autocomplete.documents.items.length;

    api.menu
      .getLiveSearchDocuments(payload, documentsQty)
      .then(documents => {
        dispatch(updateAutocompleteDocumentsResults(documents));
      })
      .catch(e => {
        logger.error('[fetchMoreAutocompleteDocuments action] error', e.message);
      });
  };
}

/* ---------------- */

/* User menu */
export const fetchUserMenuData = createAction(prefix + 'USER_MENU_FETCH_DATA');
export const setUserMenuItems = createAction(prefix + 'USER_MENU_SET_ITEMS');
/* ---------------- */

/* Site menu */
export const fetchSiteMenuData = createAction(prefix + 'SITE_MENU_FETCH_DATA');
export const setSiteMenuItems = createAction(prefix + 'SITE_MENU_SET_ITEMS');
/* ---------------- */
