import { createAction } from 'redux-actions';

const prefix = 'app/';

export const initAppRequest = createAction(prefix + 'INIT_APP');
export const initAppSuccess = createAction(prefix + 'INIT_APP_SUCCESS');
export const initAppFailure = createAction(prefix + 'INIT_APP_FAILURE');
export const setMenuConfig = createAction(prefix + 'SET_MENU_CONFIG');

export const loadThemeRequest = createAction(prefix + 'LOAD_THEME');
