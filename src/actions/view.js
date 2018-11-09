import { createAction } from 'redux-actions';

const prefix = 'view/';

export const setIsMobile = createAction(prefix + 'VIEW_SET_IS_MOBILE');
