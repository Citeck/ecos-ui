import { handleActions } from 'redux-actions';
import { initAppFailure, initAppSuccess, setAllUsersGroupName } from '../actions/app';

const initialState = {
  isInit: false,
  isInitFailure: false,
  allUsersGroupName: ''
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
    },
    [setAllUsersGroupName]: (state, action) => {
      return {
        ...state,
        allUsersGroupName: action.payload
      };
    }
  },
  initialState
);
