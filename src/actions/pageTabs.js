import { createAction } from 'redux-actions';

const prefix = 'pageTabs/';

export const setShowTabsStatus = createAction(prefix + 'SET_SHOW_TABS_STATUS');

export const initTabs = createAction(prefix + 'INIT_TABS');
export const initTabsComplete = createAction(prefix + 'INIT_TABS_COMPLETE');
export const setTabs = createAction(prefix + 'SET_TABS');
export const getTabs = createAction(prefix + 'GET_TABS');
export const moveTabs = createAction(prefix + 'MOVE_TABS');
export const setDisplayState = createAction(prefix + 'SET_DISPLAY_STATE');

export const setTab = createAction(prefix + 'SET_ONE_TAB');
export const deleteTab = createAction(prefix + 'DELETE_TAB');
export const changeTab = createAction(prefix + 'CHANGE_TAB');
export const updateTab = createAction(prefix + 'UPDATE_TAB');
export const updateTabsFromStorage = createAction(prefix + 'UPDATE_TABS_FROM_STORAGE');
