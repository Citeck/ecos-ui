import { handleActions } from 'redux-actions';
import {
  getStatusList,
  getSubordinatesTimesheetByParams,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  modifyStatus,
  setMergedList,
  setStatusList,
  setSubordinatesTimesheetByParams
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
    [getSubordinatesTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: [],
      calendarEvents: [],
      statuses: []
    }),
    [setSubordinatesTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: false,
      mergedList: actions.payload.mergedList,
      calendarEvents: actions.payload.calendarEvents,
      statuses: actions.payload.statuses.records
    }),
    [setMergedList]: (state, actions) => ({
      ...state,
      isLoading: false,
      mergedList: actions.payload
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
