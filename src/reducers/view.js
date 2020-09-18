import { handleActions } from 'redux-actions';
import { setIsMobile, setTheme } from '../actions/view';

const initialState = {
  isMobile: false,
  theme: null
};

Object.freeze(initialState);

export default handleActions(
  {
    [setIsMobile]: (state, action) => {
      return {
        ...state,
        isMobile: action.payload
      };
    },
    [setTheme]: (state, action) => {
      return {
        ...state,
        theme: action.payload
      };
    }
  },
  initialState
);
