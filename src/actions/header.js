import { createAction } from 'redux-actions';

const prefix = 'header/';

export const fetchCreateCaseWidgetData = createAction(prefix + 'CREATE_CASE_WIDGET_FETCH_DATA');
export const setCreateCaseWidgetItems = createAction(prefix + 'CREATE_CASE_WIDGET_SET_ITEMS');
export const setCreateCaseWidgetIsCascade = createAction(prefix + 'CREATE_CASE_WIDGET_SET_IS_CASCADE');

export const runSearchAutocompleteItems = createAction(prefix + 'RUN_SEARCH_AUTOCOMPLETE_ITEMS');
export const setSearchAutocompleteItems = createAction(prefix + 'SET_SEARCH_AUTOCOMPLETE_ITEMS');
export const resetSearchAutocompleteItems = createAction(prefix + 'RESET_SEARCH_AUTOCOMPLETE_ITEMS');

export const fetchUserMenuData = createAction(prefix + 'USER_MENU_FETCH_DATA');
export const setUserMenuItems = createAction(prefix + 'USER_MENU_SET_ITEMS');

export const fetchSiteMenuData = createAction(prefix + 'SITE_MENU_FETCH_DATA');
export const setSiteMenuItems = createAction(prefix + 'SITE_MENU_SET_ITEMS');
export const goToPageFromSiteMenu = createAction(prefix + 'GO_TO_PAGE_FROM_SITE_MENU');

//drafts api
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

    typeof successCallback === 'function' && successCallback(searchPhrases[lastSearchIndex]);
  };
}

export function fetchMoreAutocompleteDocuments(payload) {
  return (dispatch, getState, { api, logger }) => {
    const state = getState();
    const documentsQty = state.header.search.autocomplete.documents.items.length;

    api.menu
      .getLiveSearchDocuments(payload, documentsQty)
      .then(documents => {
        //dispatch(updateAutocompleteDocumentsResults(documents));
      })
      .catch(e => {
        logger.error('[fetchMoreAutocompleteDocuments action] error', e.message);
      });
  };
}
