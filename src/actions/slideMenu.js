import { createAction } from 'redux-actions';

const prefix = 'slideMenu/';

export const setSmallLogo = createAction(prefix + 'SET_SMALL_LOGO');
export const setLargeLogo = createAction(prefix + 'LARGE_LOGO');

export const setSlideMenuItems = createAction(prefix + 'SET_ITEMS');
export const setSlideMenuExpandableItems = createAction(prefix + 'SET_EXPANDABLE_ITEMS');

export const toggleExpanded = createAction(prefix + 'TOGGLE_EXPANDED');
export const setSelectedId = createAction(prefix + 'SET_SELECTED_ID');

export const fetchSmallLogoSrc = createAction(prefix + 'FETCH_SMALL_LOGO_SRC');
export const fetchLargeLogoSrc = createAction(prefix + 'FETCH_LARGE_LOGO_SRC');
export const fetchSlideMenuItems = createAction(prefix + 'FETCH_SLIDE_MENU_ITEMS');
