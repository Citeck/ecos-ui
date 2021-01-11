import { handleActions } from 'redux-actions';
import { setTitle } from '../actions/modelEditor';
import { updateState } from '../helpers/redux';

const initialState = {
  title: undefined
};

Object.freeze(initialState);

export default handleActions(
  {
    [setTitle]: (state, { payload: { stateId, title } }) => updateState(state, stateId, { ...initialState, title })
  },
  initialState
);
