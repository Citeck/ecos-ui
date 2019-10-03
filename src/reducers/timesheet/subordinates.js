import { handleActions } from 'redux-actions';
import {
  getSubordinatesEventsList,
  getSubordinatesList,
  setSubordinatesEventsList,
  setSubordinatesList
} from '../../actions/timesheet/subordinates';

const initialState = {
  subordinatesList: [],
  isLoadingSubordinatesList: false,
  eventsList: [],
  isLoadingEventsList: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [getSubordinatesList]: (state, actions) => ({
      ...state,
      isLoadingSubordinatesList: true,
      subordinatesList: []
    }),
    [setSubordinatesList]: (state, actions) => ({
      ...state,
      isLoadingSubordinatesList: false,
      subordinatesList: actions.payload.records
    }),
    [getSubordinatesEventsList]: (state, actions) => ({
      ...state,
      isLoadingEventsList: true,
      eventsList: []
    }),
    [setSubordinatesEventsList]: (state, actions) => ({
      ...state,
      isLoadingEventsList: false,
      eventsList: actions.payload.records
    })
  },
  initialState
);
