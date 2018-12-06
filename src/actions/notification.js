import { createAction } from 'redux-actions';

const prefix = 'notification/';

export const setNotificationMessage = createAction(prefix + 'SET_NOTIFICATION_MESSAGE');
