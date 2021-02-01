import { handleActions } from 'redux-actions';
import {
  getFormProps,
  getScenario,
  initData,
  saveScenario,
  setFormData,
  setFormProps,
  setLoading,
  setScenario,
  setTitle
} from '../actions/cmmnEditor';
import { startLoading, updateState } from '../helpers/redux';

const initialState = {
  title: undefined,
  scenario: undefined,
  formProps: {},
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initData]: startLoading(initialState),
    [getScenario]: startLoading(initialState),
    [saveScenario]: startLoading(initialState),
    [setLoading]: (state, { payload: { stateId, isLoading } }) => updateState(state, stateId, { isLoading }),
    [setTitle]: (state, { payload: { stateId, title } }) => updateState(state, stateId, { title }),
    [setScenario]: (state, { payload: { stateId, scenario } }) => updateState(state, stateId, { scenario, isLoading: false }),
    [getFormProps]: (state, { payload: { stateId } }) => updateState(state, stateId, { formProps: {} }),
    [setFormProps]: (state, { payload: { stateId, formProps } }) => updateState(state, stateId, { formProps }),
    [setFormData]: (state, { payload: { stateId, formData } }) =>
      updateState(state, stateId, {
        formProps: {
          ...state[stateId].formProps,
          formData: { ...state[stateId].formProps.formData, ...formData }
        }
      })
  },
  {}
);
