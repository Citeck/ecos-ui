import { handleActions } from 'redux-actions';
import { initAppSuccess, initAppFailure } from '../actions/app';

const initialState = {
  isInit: false,
  isInitFailure: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initAppSuccess]: (state, action) => {
      return {
        ...state,
        isInit: true
      };
    },
    [initAppFailure]: (state, action) => {
      return {
        ...state,
        isInit: true,
        isInitFailure: true
      };
    }
  },
  initialState
);
