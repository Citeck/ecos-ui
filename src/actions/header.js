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
