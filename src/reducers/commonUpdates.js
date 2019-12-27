import { handleActions } from 'redux-actions';
import { requestUpdateDataByRecord, resetUpdateDataByRecord } from '../actions/commonUpdates';

export default handleActions(
  {
    [requestUpdateDataByRecord]: (state, { payload }) => ({
      ...state,
      [payload]: true
    }),
    [resetUpdateDataByRecord]: (state, { payload }) => {
      delete state[payload];

      return state;
    }
  },
  {}
);
