import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import { getVerificationTimesheetByParams, setPopupMessage, setVerificationTimesheetByParams } from '../../actions/timesheet/verification';

const initialState = {
  isLoading: false,
  mergedList: [],
  popupMsg: ''
};

Object.freeze(initialState);

export default handleActions(
  {
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
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    })
  },
  initialState
);
