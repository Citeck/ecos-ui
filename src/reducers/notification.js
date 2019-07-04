import { handleActions } from 'redux-actions';
import uuid4 from 'uuidv4';
import { setMessageId, setNotificationMessage } from '../actions/notification';

const initialState = {
  text: ''
};

Object.freeze(initialState);

export default handleActions(
  {
    [setNotificationMessage]: (state, action) => ({
      ...state,
      text: action.payload
    })
  },
  initialState
);
