import get from 'lodash/get';
import { handleActions } from 'redux-actions';

import {
  getCalendarEvents,
  getVerificationTimesheetByParams,
  modifyStatus,
  resetVerificationTimesheet,
  setLoading,
  setMergedList,
  setPopupMessage,
  setUpdatingEventDayHours,
  setVerificationTimesheetByParams
} from '../../actions/timesheet/verification';

const initialState = {
  isLoading: false,
  mergedList: [],
  popupMsg: '',
  loadingOnTimesheet: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setPopupMessage]: (state, { payload }) => ({
      ...state,
      popupMsg: payload
    }),
    [setLoading]: (state, { payload }) => ({
      ...state,
      isLoading: payload
    }),
    [setMergedList]: (state, { payload }) => ({
      ...state,
      mergedList: payload || [],
      isLoading: false
    }),
    [resetVerificationTimesheet]: () => ({
      ...initialState
    }),
    [getVerificationTimesheetByParams]: state => ({
      ...state,
      isLoading: true,
      mergedList: []
    }),
    [setVerificationTimesheetByParams]: (state, { payload }) => ({
      ...state,
      isLoading: false,
      loadingOnTimesheet: '',
      mergedList: get(payload, 'mergedList', [])
    }),
    [setUpdatingEventDayHours]: (state, { payload }) => ({
      ...state,
      updatingHours: payload
    }),
    [modifyStatus]: state => ({
      ...state,
      isLoading: true
    }),
    [getCalendarEvents]: (state, { payload }) => ({
      ...state,
      loadingOnTimesheet: get(payload, 'userName', '')
    })
  },
  initialState
);
