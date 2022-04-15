import { handleActions } from 'redux-actions';
import pick from 'lodash/pick';

import { deleteStateById, startLoading, updateState } from '../helpers/redux';
import { getJournal, getModel, resetDashlet, setJournal, setModel } from '../actions/processStatistics';

const initialState = {
  isLoadingJournal: false,
  isLoadingModel: false,
  data: [],
  journalConfig: null,
  model: null
};

export default handleActions(
  {
    [getModel]: startLoading(initialState, 'isLoadingModel'),
    [getJournal]: startLoading(initialState, 'isLoadingJournal'),
    [setModel]: (state, { payload }) => updateState(state, payload.stateId, { ...pick(payload, 'model'), isLoadingModel: false }),
    [setJournal]: (state, { payload }) =>
      updateState(state, payload.stateId, { ...pick(payload, 'data', 'journalConfig'), isLoadingJournal: false }),
    [resetDashlet]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
