import { handleActions } from 'redux-actions';
import { setNotificationMessage } from '../actions/notification';

const initialState = {
  text: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setNotificationMessage]: (state, action) => {
      return {
        ...state,
        text: action.payload
      };
    }
  },
  initialState
);
