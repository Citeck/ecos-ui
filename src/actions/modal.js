import { createAction } from 'redux-actions';

const prefix = 'modal/';

export const showModal = createAction(prefix + 'SHOW_MODAL');
export const hideModal = createAction(prefix + 'HIDE_MODAL');
