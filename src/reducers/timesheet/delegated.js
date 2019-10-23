import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import {
  getDelegatedTimesheetByParams,
  resetDelegatedTimesheet,
  setDelegatedTimesheetByParams,
  setLoading,
  setMergedList,
  setPopupMessage,
  setUpdatingEventDayHours
} from '../../actions/timesheet/delegated';

const initialState = {
  isLoading: false,
  mergedList: [],
  popupMsg: '',
  actionCounts: {
    all: 0
  }
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
    [setMergedList]: (state, actions) => ({
      ...state,
      mergedList: actions.payload || [],
      isLoading: false
    }),
    [resetDelegatedTimesheet]: (state, actions) => ({
      ...initialState
    }),
    [getDelegatedTimesheetByParams]: (state, actions) => ({
      ...state,
      ...initialState,
      isLoading: true
    }),
    [setDelegatedTimesheetByParams]: (state, actions) => ({
      ...state,
      mergedList: get(actions, 'payload.mergedList', []),
      actionCounts: get(actions, 'payload.actionCounts', {}),
      isLoading: false
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    })
  },
  initialState
);
