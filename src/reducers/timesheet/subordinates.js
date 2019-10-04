import { handleActions } from 'redux-actions';
import {
  getEventsList,
  getSubordinatesList,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  setSubordinatesEventsList
} from '../../actions/timesheet/subordinates';

const initialState = {
  isLoading: false,
  subordinatesEventsList: [],
  isLoadingSubordinatesList: false,
  isLoadingEventsList: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initSubordinatesTimesheetStart]: (state, actions) => ({
      ...state,
      isLoading: true,
      subordinatesEventsList: []
    }),
    [initSubordinatesTimesheetEnd]: (state, actions) => ({
      ...state,
      isLoading: false,
      subordinatesEventsList: actions.payload.records
    }),
    [getSubordinatesList]: (state, actions) => ({
      ...state,
      isLoading: true
    }),
    [getEventsList]: (state, actions) => ({
      ...state,
      isLoading: true
    }),
    [setSubordinatesEventsList]: (state, actions) => ({
      ...state,
      isLoading: false,
      subordinatesEventsList: actions.payload.records
    })
  },
  initialState
);
