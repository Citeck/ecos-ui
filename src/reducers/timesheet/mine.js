import { handleActions } from 'redux-actions';
import {
  getMyTimesheetByParams,
  getStatus,
  initMyTimesheetEnd,
  initMyTimesheetStart,
  modifyStatus,
  setMyTimesheetByParams,
  setStatus
} from '../../actions/timesheet/mine';

const initialState = {
  isLoading: false,
  isLoadingStatus: false,
  status: {},
  calendarEvents: [],
  mergedEvents: []
};

Object.freeze(initialState);

export default handleActions(
  {
    [initMyTimesheetStart]: (state, actions) => ({
      ...state,
      ...initialState,
      isLoading: true,
      isLoadingStatus: true
    }),
    [initMyTimesheetEnd]: (state, actions) => ({
      ...state,
      status: actions.payload.status,
      calendarEvents: actions.payload.calendarEvents,
      mergedEvents: actions.payload.mergedEvents,
      isLoading: false,
      isLoadingStatus: false
    }),
    [getMyTimesheetByParams]: (state, actions) => ({
      ...state,
      ...initialState,
      isLoading: true,
      isLoadingStatus: true
    }),
    [setMyTimesheetByParams]: (state, actions) => ({
      ...state,
      status: actions.payload.status,
      calendarEvents: actions.payload.calendarEvents,
      mergedEvents: actions.payload.mergedEvents,
      isLoading: false,
      isLoadingStatus: false
    }),
    [getStatus]: (state, actions) => ({
      ...state,
      status: {},
      isLoadingStatus: true
    }),
    [setStatus]: (state, actions) => ({
      ...state,
      status: actions.payload,
      isLoadingStatus: false
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      status: {},
      isLoadingStatus: true
    })
  },
  initialState
);
