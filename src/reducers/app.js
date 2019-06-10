import { handleActions } from 'redux-actions';
import { initAppSuccess, initAppFailure } from '../actions/app';
import { MENU_TYPE } from '../constants';

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
