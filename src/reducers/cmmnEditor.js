import { handleActions } from 'redux-actions';
import { initData, setDiagram, setTitle } from '../actions/cmmnEditor';
import { updateState } from '../helpers/redux';

const initialState = {
  title: undefined
};

Object.freeze(initialState);

export default handleActions(
  {
    [initData]: (state, { payload: { stateId } }) => ({ ...state, [stateId]: initialState }),
    [setTitle]: (state, { payload: { stateId, title } }) => updateState(state, stateId, { ...initialState, title }),
    [setDiagram]: (state, { payload: { stateId, diagram } }) => updateState(state, stateId, { ...initialState, diagram })
  },
  initialState
);
