import { createAction } from 'redux-actions';

const prefix = 'pageTabs/';

export const setShowTabsStatus = createAction(prefix + 'SET_SHOW_TABS_STATUS');

export const initTabs = createAction(prefix + 'INIT_TABS');
export const initTabsComplete = createAction(prefix + 'INIT_TABS_COMPLETE');
export const setLocalTabs = createAction(prefix + 'SET_LOCAL_TABS');
export const setTabs = createAction(prefix + 'SET_TABS');
export const getTabs = createAction(prefix + 'GET_TABS');
export const addTab = createAction(prefix + 'ADD_TAB');

export const changeActiveTab = createAction(prefix + 'CHANGE_ACTIVE_TAB');
export const setActiveTabTitle = createAction(prefix + 'SET_ACTIVE_TAB_TITLE');
export const getActiveTabTitle = createAction(prefix + 'GET_ACTIVE_TITLE_INFO');

export const setTabTitle = createAction(prefix + 'SET_TAB_TITLE');
export const getTabTitle = createAction(prefix + 'GET_TAB_TITLE');
