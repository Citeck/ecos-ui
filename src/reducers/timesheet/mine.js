import { handleActions } from 'redux-actions';
import { MaxAttempts } from '../../helpers/timesheet/constants';
import {
  getMyTimesheetByParams,
  getStatus,
  modifyStatus,
  setMyTimesheetByParams,
  setPopupMessage,
  setStatus,
  setUpdatingEventDayHours,
  setUpdatingStatus
} from '../../actions/timesheet/mine';

const initialState = {
  isLoading: false,
  isLoadingStatus: false,
  isUpdatingStatus: false,
  status: {},
  countAttemptGetStatus: 0,
  calendarEvents: [],
  mergedEvents: [],
  updatingHours: {},
  popupMsg: ''
};

Object.freeze(initialState);

export default handleActions(
  {
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
      isLoadingStatus: true,
      countAttemptGetStatus: state.isUpdatingStatus && state.countAttemptGetStatus > 0 ? state.countAttemptGetStatus - 1 : 0
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
    }),
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    }),
    [setUpdatingStatus]: (state, actions) => ({
      ...state,
      isUpdatingStatus: actions.payload,
      countAttemptGetStatus: actions.payload ? MaxAttempts.STATUS : 0
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    })
  },
  initialState
);
