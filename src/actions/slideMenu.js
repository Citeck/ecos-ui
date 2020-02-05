import { createAction } from 'redux-actions';

const prefix = 'slideMenu/';

export const setSmallLogo = createAction(prefix + 'SET_SMALL_LOGO');
export const setLargeLogo = createAction(prefix + 'LARGE_LOGO');
export const setSlideMenuItems = createAction(prefix + 'SET_ITEMS');
export const setSlideMenuExpandableItems = createAction(prefix + 'SET_EXPANDABLE_ITEMS');
export const setInitExpandableItems = createAction(prefix + 'SET_INIT_EXPANDABLE_ITEMS');
export const toggleIsOpen = createAction(prefix + 'TOGGLE_IS_OPEN');
export const toggleExpanded = createAction(prefix + 'TOGGLE_EXPANDED');
export const collapseAllItems = createAction(prefix + 'COLLAPSE_ALL_ITEMS');
export const setSelectedId = createAction(prefix + 'SET_SELECTED_ID');
export const fetchSmallLogoSrc = createAction(prefix + 'FETCH_SMALL_LOGO_SRC');
export const fetchLargeLogoSrc = createAction(prefix + 'FETCH_LARGE_LOGO_SRC');
export const fetchSlideMenuItems = createAction(prefix + 'FETCH_SLIDE_MENU_ITEMS');
export const setScrollTop = createAction(prefix + 'SET_SCROLL_TOP');
export const setIsReady = createAction(prefix + 'SET_IS_READY');
export const getSiteDashboardEnable = createAction(prefix + 'GET_SITE_DASHBOARD_ENABLE');
export const setSiteDashboardEnable = createAction(prefix + 'SET_SITE_DASHBOARD_ENABLE');

export function loadMenuItemIconUrl(iconName, onSuccessCallback) {
  return (dispatch, getState, { api }) => {
    if (!iconName) {
      return null;
    }

    api.menu.getMenuItemIconUrl(iconName).then(data => {
      typeof onSuccessCallback === 'function' && onSuccessCallback(data);
    });
  };
}
