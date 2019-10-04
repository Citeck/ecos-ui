import { handleActions } from 'redux-actions';
import { getStatus, initMyTimesheetEnd, initMyTimesheetStart, setStatus } from '../../actions/timesheet/mine';

const initialState = {
  isLoading: false,
  status: {}
};

Object.freeze(initialState);

export default handleActions(
  {
    [initMyTimesheetStart]: (state, actions) => ({
      ...state,
      isLoading: true,
      status: []
    }),
    [initMyTimesheetEnd]: (state, actions) => ({
      ...state,
      status: actions.payload.status,
      isLoading: false
    }),
    [getStatus]: (state, actions) => ({
      ...state,
      status: [],
      isLoading: true
    }),
    [setStatus]: (state, actions) => ({
      ...state,
      statuses: actions.payload,
      isLoading: false
    })
  },
  initialState
);
