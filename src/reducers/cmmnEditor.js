import { handleActions } from 'redux-actions';
import { getScenario, initData, saveScenario, setScenario, setTitle } from '../actions/cmmnEditor';
import { startLoading, updateState } from '../helpers/redux';

const initialState = {
  title: undefined,
  scenario: undefined,
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initData]: startLoading(initialState),
    [setTitle]: (state, { payload: { stateId, title } }) => updateState(state, stateId, { title }),
    [getScenario]: (state, { payload: { stateId, scenario } }) => updateState(state, stateId, { scenario, isLoading: true }),
    [setScenario]: (state, { payload: { stateId, scenario } }) => updateState(state, stateId, { scenario, isLoading: false }),
    [saveScenario]: startLoading(initialState)
  },
  {}
);
