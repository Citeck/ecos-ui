import { handleActions } from 'redux-actions';
import { setIsMobile } from '../actions/view';

const initialState = {
  isMobile: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setIsMobile]: (state, action) => {
      return {
        ...state,
        isMobile: action.payload
      };
    }
  },
  initialState
);
