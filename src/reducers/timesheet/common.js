import { handleActions } from 'redux-actions';
import { getTotalCounts, setTotalCounts, setUsers } from '../../actions/timesheet/common';

const initialState = {
  totalCounts: {
    delegated: null
  },
  users: []
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
    }),
    [setUsers]: (state, actions) => ({
      ...state,
      users: actions.payload
    })
  },
  initialState
);
