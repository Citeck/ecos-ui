import { handleActions } from 'redux-actions';
import {
  getFormProps,
  getModel,
  initData,
  saveModel,
  setFormData,
  setFormProps,
  setIsTableView,
  setLoading,
  setModel,
  setLoaderFormData,
  setHasDeployRights,
  setTitle
} from '../actions/dmnEditor';
import { startLoading, updateState } from '../helpers/redux';

const initialState = {
  title: undefined,
  model: undefined,
  isLoading: false,

  isTableView: false
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
    [getFormProps]: (state, { payload: { stateId } }) => updateState(state, stateId, { formProps: {}, isLoadingProps: true }),
    [setLoaderFormData]: (state, { payload: { stateId, isLoadingProps } }) => updateState(state, stateId, { isLoadingProps }),
    [setFormProps]: (state, { payload: { stateId, formProps } }) => updateState(state, stateId, { formProps, isLoadingProps: false }),
    [setHasDeployRights]: (state, { payload: { stateId, hasDeployRights } }) => updateState(state, stateId, { hasDeployRights }),
    [setFormData]: (state, { payload: { stateId, formData } }) =>
      updateState(state, stateId, {
        formProps: {
          ...state[stateId].formProps,
          formData: { ...state[stateId].formProps.formData, ...formData }
        }
      }),
    [setIsTableView]: (state, { payload: { stateId, isHidden } }) => updateState(state, stateId, { isTableView: isHidden })
  },
  initialState
);
