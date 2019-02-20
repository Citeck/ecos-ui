import { createAction } from 'redux-actions';

const prefix = 'view/';

export const setIsMobile = createAction(prefix + 'SET_IS_MOBILE');
export const setTheme = createAction(prefix + 'SET_THEME');
