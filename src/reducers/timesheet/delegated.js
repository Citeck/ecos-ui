import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import { getDelegatedTimesheetByParams, setDelegatedTimesheetByParams, setPopupMessage } from '../../actions/timesheet/delegated';

const initialState = {
  isLoading: false,
  mergedList: [],
  subordinates: [],
  calendarEvents: [],
  statuses: [],
  popupMsg: '',
  actionCounts: {
    all: 0
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [getDelegatedTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: [],
      subordinates: [],
      calendarEvents: [],
      statuses: []
    }),
    [setDelegatedTimesheetByParams]: (state, actions) => ({
      ...state,
      mergedList: get(actions, 'payload.mergedList', []),
      subordinates: get(actions, 'payload.subordinates.records', []),
      calendarEvents: get(actions, 'payload.calendarEvents', []),
      statuses: get(actions, 'payload.statuses.records', []),
      actionCounts: get(actions, 'payload.actionCounts', {}),
      isLoading: false
    }),
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    })
  },
  initialState
);
