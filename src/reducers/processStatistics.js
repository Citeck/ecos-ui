import { handleActions } from 'redux-actions';
import pick from 'lodash/pick';

import { getJournal, getModel, resetDashlet, setJournal, setModel } from '../actions/processStatistics';
import { deleteStateById, startLoading, updateState } from '../helpers/redux';

const initialState = {
  isLoading: false,
  data: [],
  columns: [],
  journalConfig: null,
  model: null
};

export default handleActions(
  {
    [getModel]: startLoading(initialState),
    [getJournal]: startLoading(initialState),
    [setModel]: (state, { payload }) => updateState(state, payload.stateId, { ...pick(payload, 'model'), isLoading: false }),
    [setJournal]: (state, { payload }) =>
      updateState(state, payload.stateId, { ...pick(payload, 'data', 'columns', 'journalConfig'), isLoading: false }),
    [resetDashlet]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
