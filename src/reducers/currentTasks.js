import { handleActions } from 'redux-actions';

import { deleteStateById, updateState } from '../helpers/redux';
import {
  getCurrentTaskList,
  initCurrentTasks,
  resetCurrentTaskList,
  setCurrentTaskList,
  setInlineTools,
  setSettings
} from '../actions/currentTasks';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  list: [],
  totalCount: 0,
  actions: [],
  inlineTools: {}
};

export default handleActions(
  {
    [initCurrentTasks]: (state, { payload: { stateId, initData = {} } }) =>
      updateState(state, stateId, {
        ...initialState,
        ...initData,
        isLoading: true
      }),
    [getCurrentTaskList]: (state, { payload: { stateId } }) => updateState(state, stateId, { list: [], totalCount: 0, isLoading: true }),
    [setCurrentTaskList]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, { ...data, isLoading: false }),
    [setInlineTools]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, data),
    [resetCurrentTaskList]: (state, { payload: { stateId } }) => deleteStateById(state, stateId),
    [setSettings]: (state, { payload: { stateId, settings } }) => updateState(state, stateId, { settings })
  },
  commonInitialState
);
