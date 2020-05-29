import { createAction } from 'redux-actions';

const prefix = 'icon-select/';

export const setCustomIcons = createAction(prefix + 'SET_CUSTOM_ICONS');
export const setFontIcons = createAction(prefix + 'SET_FONT_ICONS');

export const getCustomIcons = createAction(prefix + 'GET_CUSTOM_ICONS');
export const getFontIcons = createAction(prefix + 'GET_FONT_ICONS');
export const uploadCustomIcon = createAction(prefix + 'GET_UPLOAD_ICONS');
export const deleteCustomIcon = createAction(prefix + 'GET_DELETE_ICONS');
