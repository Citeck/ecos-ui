import { handleActions } from 'redux-actions';
import { getStatus, initMyTimesheetEnd, initMyTimesheetStart, modifyStatus, setStatus } from '../../actions/timesheet/mine';

const initialState = {
  isLoading: false,
  isLoadingStatus: false,
  status: {}
};

Object.freeze(initialState);

export default handleActions(
  {
    [initMyTimesheetStart]: (state, actions) => ({
      ...state,
      isLoading: true,
      status: {}
    }),
    [initMyTimesheetEnd]: (state, actions) => ({
      ...state,
      status: actions.payload.status,
      isLoading: false
    }),
    [getStatus]: (state, actions) => ({
      ...state,
      status: {},
      isLoadingStatus: true
    }),
    [setStatus]: (state, actions) => ({
      ...state,
      status: actions.payload,
      isLoadingStatus: false
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      status: {},
      isLoadingStatus: true
    })
  },
  initialState
);
