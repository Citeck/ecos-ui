import { handleActions } from 'redux-actions';
import {
  getFormProps,
  getModel,
  initData,
  saveModel,
  setFormData,
  setFormProps,
  setLoading,
  setModel,
  setTitle
} from '../actions/bpmnEditor';
import { startLoading, updateState } from '../helpers/redux';

const initialState = {
  title: undefined,
  model: undefined,
  formProps: {},
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initData]: startLoading(initialState),
    [getModel]: startLoading(initialState),
    [saveModel]: startLoading(initialState),
    [setLoading]: (state, { payload: { stateId, isLoading } }) => updateState(state, stateId, { isLoading }),
    [setTitle]: (state, { payload: { stateId, title } }) => updateState(state, stateId, { title }),
    [setModel]: (state, { payload: { stateId, model } }) => updateState(state, stateId, { model, isLoading: false }),
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
