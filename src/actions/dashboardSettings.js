import { createAction } from 'redux-actions';

const prefix = 'dashboard/settings';

export const getLayouts = createAction(prefix + 'GET_LAYOUTS_REQUEST');
export const getWidgets = createAction(prefix + 'GET_WIDGETS_REQUEST');
export const getMenuItems = createAction(prefix + 'GET_MENU_ITEMS_REQUEST');
export const getConfigLayout = createAction(prefix + 'GET_CONFIG_LAYOUT_REQUEST');
export const saveConfigLayout = createAction(prefix + 'SAVE_CONFIG_LAYOUT_REQUEST');

export const getLayoutsRequest = createAction(prefix + 'GET_LAYOUTS_REQUEST');
export const getWidgetsRequest = createAction(prefix + 'GET_WIDGETS_REQUEST');
export const getMenuItemsRequest = createAction(prefix + 'GET_MENU_ITEMS_REQUEST');
export const getConfigLayoutRequest = createAction(prefix + 'GET_CONFIG_LAYOUT_REQUEST');
export const saveConfigLayoutRequest = createAction(prefix + 'SAVE_CONFIG_LAYOUT_REQUEST');
