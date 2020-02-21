import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import { MaxAttempts } from '../../constants/timesheet';
import {
  getMyTimesheetByParams,
  getStatus,
  modifyStatus,
  resetMyTimesheet,
  setMyTimesheetByParams,
  setPopupMessage,
  setStatus,
  setUpdatingEventDayHours,
  setUpdatingStatus,
  setDelegatedTo,
  setEvents
} from '../../actions/timesheet/mine';

const initialState = {
  isLoading: false,
  isLoadingStatus: false,
  isUpdatingStatus: false,
  status: {},
  countAttemptGetStatus: 0,
  mergedEvents: [],
  updatingHours: {},
  popupMsg: '',
  delegatedToRef: '',
  delegatedToUserName: '',
  delegatedToDisplayName: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    }),
    [resetMyTimesheet]: (state, actions) => ({
      ...initialState
    }),
    [getMyTimesheetByParams]: (state, actions) => ({
      ...state,
      ...initialState,
      isLoading: true,
      isLoadingStatus: true
    }),
    [setMyTimesheetByParams]: (state, actions) => ({
      ...state,
      status: get(actions, 'payload.status', {}),
      mergedEvents: get(actions, 'payload.mergedEvents', []),
      ...get(actions, 'payload.deputy', {}),
      isLoading: false,
      isLoadingStatus: false
    }),
    [getStatus]: (state, actions) => ({
      ...state,
      status: {},
      isLoadingStatus: true,
      countAttemptGetStatus: state.isUpdatingStatus && state.countAttemptGetStatus > 0 ? state.countAttemptGetStatus - 1 : 0
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      status: {},
      isLoadingStatus: true
    }),
    [setStatus]: (state, actions) => ({
      ...state,
      status: actions.payload,
      isLoadingStatus: false
    }),
    [setUpdatingStatus]: (state, actions) => ({
      ...state,
      isUpdatingStatus: actions.payload,
      countAttemptGetStatus: actions.payload ? MaxAttempts.STATUS : 0
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    }),
    [setDelegatedTo]: (state, actions) => ({
      ...state,
      delegatedToRef: actions.payload.ref,
      delegatedToUserName: actions.payload.name,
      delegatedToDisplayName: actions.payload.displayName
    }),
    [setEvents]: (state, { payload }) => ({
      ...state,
      mergedEvents: payload
    })
  },
  initialState
);
