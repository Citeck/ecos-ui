import { handleActions } from 'redux-actions';
import { getTotalCounts, setTotalCounts } from '../../actions/timesheet/common';

const initialState = {
  totalCounts: {
    delegated: null
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [getTotalCounts]: (state, actions) => ({
      ...state,
      totalCounts: {
        ...initialState.totalCounts
      }
    }),
    [setTotalCounts]: (state, actions) => ({
      ...state,
      totalCounts: {
        ...state.totalCounts,
        ...actions.payload
      }
    })
  },
  initialState
);
