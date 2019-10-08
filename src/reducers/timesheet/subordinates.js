import { handleActions } from 'redux-actions';
import {
  getCalendarEventList,
  getStatusList,
  getSubordinatesList,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  modifyStatus,
  setCalendarEventList,
  setMergedList,
  setStatusList,
  setSubordinatesList
} from '../../actions/timesheet/subordinates';

const initialState = {
  isLoading: false,
  mergedList: [],
  subordinates: [],
  calendarEvents: [],
  statuses: []
};

Object.freeze(initialState);

export default handleActions(
  {
    [initSubordinatesTimesheetStart]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: [],
      subordinates: [],
      calendarEvents: [],
      statuses: []
    }),
    [initSubordinatesTimesheetEnd]: (state, actions) => ({
      ...state,
      mergedList: actions.payload.mergedList,

      subordinates: actions.payload.subordinates.records,
      calendarEvents: actions.payload.calendarEvents,
      statuses: actions.payload.statuses.records,

      isLoading: false
    }),
    [setMergedList]: (state, actions) => ({
      ...state,
      isLoading: false,
      mergedList: actions.payload
    }),
    [getSubordinatesList]: (state, actions) => ({
      ...state,
      subordinates: [],
      isLoading: true
    }),
    [setSubordinatesList]: (state, actions) => ({
      ...state,
      subordinates: actions.payload.records,
      isLoading: false
    }),
    [getCalendarEventList]: (state, actions) => ({
      ...state,
      calendarEvents: [],
      isLoading: true
    }),
    [setCalendarEventList]: (state, actions) => ({
      ...state,
      calendarEvents: actions.payload,
      isLoading: false
    }),
    [getStatusList]: (state, actions) => ({
      ...state,
      statuses: [],
      isLoading: true
    }),
    [setStatusList]: (state, actions) => ({
      ...state,
      statuses: actions.payload.records,
      isLoading: false
    }),
    [modifyStatus]: (state, actions) => ({
      ...state
    })
  },
  initialState
);
