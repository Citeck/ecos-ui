import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import {
  getSubordinatesTimesheetByParams,
  modifyStatus,
  resetSubordinatesTimesheet,
  setLoading,
  setMergedList,
  setPopupMessage,
  setSubordinatesTimesheetByParams,
  setUpdatingEventDayHours
} from '../../actions/timesheet/subordinates';

const initialState = {
  isLoading: false,
  mergedList: [],
  updatingHours: {},
  popupMsg: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setLoading]: (state, actions) => ({
      ...state,
      isLoading: actions.payload
    }),
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    }),
    [resetSubordinatesTimesheet]: (state, actions) => ({
      ...initialState
    }),
    [getSubordinatesTimesheetByParams]: (state, actions) => ({
      ...state,
      ...initialState,
      isLoading: true
    }),
    [setSubordinatesTimesheetByParams]: (state, actions) => ({
      ...state,
      mergedList: get(actions, 'payload.mergedList', []),
      isLoading: false
    }),
    [setMergedList]: (state, actions) => ({
      ...state,
      mergedList: actions.payload || [],
      isLoading: false
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      isLoading: true
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    })
  },
  initialState
);
