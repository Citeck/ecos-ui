import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import {
  getVerificationTimesheetByParams,
  modifyStatus,
  resetVerificationTimesheet,
  setLoading,
  setPopupMessage,
  setUpdatingEventDayHours,
  setVerificationTimesheetByParams
} from '../../actions/timesheet/verification';

const initialState = {
  isLoading: false,
  mergedList: [],
  popupMsg: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    }),
    [setLoading]: (state, actions) => ({
      ...state,
      isLoading: actions.payload
    }),
    [resetVerificationTimesheet]: (state, actions) => ({
      ...initialState
    }),
    [getVerificationTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: []
    }),
    [setVerificationTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: false,
      mergedList: get(actions, 'payload.mergedList', [])
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      isLoading: true
    })
  },
  initialState
);
