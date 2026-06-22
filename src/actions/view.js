import { createAction } from 'redux-actions';

const prefix = 'view/';

export const detectMobileDevice = createAction(prefix + 'DETECT_MOBILE_DEVICE');
export const setIsMobile = createAction(prefix + 'SET_IS_MOBILE');

export const loadThemeRequest = createAction(prefix + 'LOAD_THEME');
export const setTheme = createAction(prefix + 'SET_THEME');
export const setThemeConfig = createAction(prefix + 'SET_THEME_CONFIG');
