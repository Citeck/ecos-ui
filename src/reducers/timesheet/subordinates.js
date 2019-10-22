import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import {
  getSubordinatesTimesheetByParams,
  modifyStatus,
  setLoading,
  setMergedList,
  setPopupMessage,
  setStatusList,
  setSubordinatesTimesheetByParams,
  setUpdatingEventDayHours
} from '../../actions/timesheet/subordinates';

const initialState = {
  isLoading: false,
  mergedList: [],
  subordinates: [],
  calendarEvents: [],
  statuses: [],
  updatingHours: {},
  popupMsg: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [getSubordinatesTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: [],
      subordinates: [],
      calendarEvents: [],
      statuses: []
    }),
    [setSubordinatesTimesheetByParams]: (state, actions) => ({
      ...state,
      mergedList: get(actions, 'payload.mergedList', []),
      subordinates: get(actions, 'payload.subordinates.records', []),
      calendarEvents: get(actions, 'payload.calendarEvents', []),
      statuses: get(actions, 'payload.statuses.records', []),
      isLoading: false
    }),
    [setMergedList]: (state, actions) => ({
      ...state,
      mergedList: get(actions, 'payload.mergedList', []),
      isLoading: false
    }),
    [setStatusList]: (state, actions) => ({
      ...state,
      statuses: get(actions, 'payload.statuses.records', [])
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      isLoading: true
    }),
    [setLoading]: (state, actions) => ({
      ...state,
      isLoading: actions.payload
    }),
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    })
  },
  initialState
);
