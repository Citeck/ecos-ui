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
  setUpdatingEventDayHours,
  setDelegatedTo,
  setEvents
} from '../../actions/timesheet/subordinates';

const initialState = {
  isLoading: false,
  mergedList: [],
  updatingHours: {},
  popupMsg: '',
  delegatedToRef: '',
  delegatedToUserName: '',
  delegatedToDisplayName: ''
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
    [setMergedList]: (state, actions) => ({
      ...state,
      mergedList: actions.payload || [],
      isLoading: false
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
      ...get(actions, 'payload.deputy', {}),
      isLoading: false
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      isLoading: true
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
      mergedList: payload
    })
  },
  initialState
);
