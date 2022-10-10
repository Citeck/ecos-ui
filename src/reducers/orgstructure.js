import { handleActions } from 'redux-actions';
import { setSelectedPerson } from '../actions/orgstructure';

const initialState = { id: '' };

Object.freeze(initialState);

export default handleActions(
  {
    [setSelectedPerson]: (state, action) => ({
      ...state,
      id: action.payload
    })
  },
  initialState
);
