import { handleActions } from 'redux-actions';
import {
  getCurrentTaskList,
  initCurrentTasks,
  resetCurrentTaskList,
  setActions,
  setCurrentTaskList,
  setInlineTools
} from '../actions/currentTasks';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  list: [],
  totalCount: 0,
  actions: [],
  inlineTools: {}
};

const updateState = (state, stateId, newData = {}) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateById(state, stateId, initialState),
    ...newData
  }
});

export default handleActions(
  {
    [initCurrentTasks]: (state, { payload: { stateId } }) => updateState(state, stateId, { ...initialState, isLoading: true }),
    [getCurrentTaskList]: (state, { payload: { stateId } }) => updateState(state, stateId, { list: [], totalCount: 0, isLoading: true }),
    [setCurrentTaskList]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, { ...data, isLoading: false }),
    [setActions]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, data),
    [setInlineTools]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, data),
    [resetCurrentTaskList]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  commonInitialState
);
