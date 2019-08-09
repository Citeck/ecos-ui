import { get } from 'lodash';

export const selectDataEventsHistoryByStateId = (state, dId) => get(state, ['eventsHistory', dId]);
export const selectListEventsHistory = (state, dId) => get(state, ['eventsHistory', dId, 'list'], []);
