import { handleActions } from 'redux-actions';
import {
  getEventsList,
  getStatusList,
  getSubordinatesList,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  modifyStatus,
  setEventsList,
  setMergedList,
  setStatusList,
  setSubordinatesList
} from '../../actions/timesheet/subordinates';

const initialState = {
  isLoading: false,
  mergedList: [],
  subordinates: [],
  events: [],
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
      events: [],
      statuses: []
    }),
    [initSubordinatesTimesheetEnd]: (state, actions) => ({
      ...state,
      mergedList: actions.payload.mergedList,

      subordinates: actions.payload.subordinates.records,
      events: actions.payload.events.records,
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
    [getEventsList]: (state, actions) => ({
      ...state,
      events: [],
      isLoading: true
    }),
    [setEventsList]: (state, actions) => ({
      ...state,
      events: actions.payload.records,
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
