import { createAction } from 'redux-actions';

const prefix = 'pageTabs/';

export const getShowTabsStatus = createAction(prefix + 'GET_SHOW_TABS_STATUS');
export const setShowTabsStatus = createAction(prefix + 'SET_SHOW_TABS_STATUS');
