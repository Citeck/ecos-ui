import { handleActions } from 'redux-actions';
import {
  getVerificationTimesheetByParams,
  initVerificationTimesheetEnd,
  initVerificationTimesheetStart,
  setPopupMessage,
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
    [initVerificationTimesheetStart]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: []
    }),
    [initVerificationTimesheetEnd]: (state, actions) => ({
      ...state,
      mergedList: actions.payload.mergedList,
      isLoading: false
    }),
    [getVerificationTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: true,
      mergedList: []
    }),
    [setVerificationTimesheetByParams]: (state, actions) => ({
      ...state,
      isLoading: false,
      mergedList: actions.payload.mergedList
    }),
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    })
  },
  initialState
);
