import { handleActions } from 'redux-actions';
import {
  getFormProps,
  getModel,
  initData,
  saveModel,
  setFormData,
  setFormProps,
  setLoaderFormData,
  setLoading,
  setHasDeployRights,
  setModel,
  setTitle
} from '../actions/bpmnEditor';
import { startLoading, updateState } from '../helpers/redux';

const initialState = {
  title: undefined,
  model: undefined,
  sectionPath: '',
  formProps: {},
  isLoading: false,
  isLoadingProps: false,
  hasDeployRights: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initData]: startLoading(initialState),
    [getModel]: startLoading(initialState),
    [saveModel]: startLoading(initialState),
    [setLoading]: (state, { payload: { stateId, isLoading } }) => updateState(state, stateId, { isLoading }),
    [setTitle]: (state, { payload: { stateId, title } }) => updateState(state, stateId, { title }),
    [setModel]: (state, { payload: { stateId, model, sectionPath } }) =>
      updateState(state, stateId, { sectionPath, model, isLoading: false }),
    [setHasDeployRights]: (state, { payload: { stateId, hasDeployRights } }) => updateState(state, stateId, { hasDeployRights }),
    [getFormProps]: (state, { payload: { stateId } }) => updateState(state, stateId, { formProps: {}, isLoadingProps: true }),
    [setLoaderFormData]: (state, { payload: { stateId, isLoadingProps } }) => updateState(state, stateId, { isLoadingProps }),
    [setFormProps]: (state, { payload: { stateId, formProps } }) => updateState(state, stateId, { formProps, isLoadingProps: false }),
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
