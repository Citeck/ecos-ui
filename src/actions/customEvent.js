import { createAction } from 'redux-actions';

const prefix = 'customEvent/';

export const registerEventListeners = createAction(prefix + 'REGISTER_EVENT_LISTENERS');
export const handleEventChangeUrl = createAction(prefix + 'HANDLE_EVENT_CHANGE_URL');
