import { createAction } from 'redux-actions';

const prefix = 'pageTabs/';

export const getShowTabsStatus = createAction(prefix + 'GET_SHOW_TABS_STATUS');
export const setShowTabsStatus = createAction(prefix + 'SET_SHOW_TABS_STATUS');
export const setTabs = createAction(prefix + 'SET_TABS');
export const changeActiveTab = createAction(prefix + 'CHANGE_ACTIVE_TAB');
export const getTabs = createAction(prefix + 'GET_TABS');
export const setActiveTabTitle = createAction(prefix + 'SET_ACTIVE_TAB_TITLE');
