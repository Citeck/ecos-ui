import { handleActions } from 'redux-actions';
import pick from 'lodash/pick';

import { getEventsHistory, resetEventsHistory, setEventsHistory, filterJournalHistory, getJournalHistory } from '../actions/eventsHistory';
import { deleteStateById, startLoading, updateState } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: [],
  columns: [],
  journalConfig: null
};

export default handleActions(
  {
    [getEventsHistory]: startLoading(initialState),
    [getJournalHistory]: startLoading(initialState),
    [filterJournalHistory]: startLoading(initialState),
    [setEventsHistory]: (state, { payload }) =>
      updateState(state, payload.stateId, { ...pick(payload, 'list', 'columns', 'journalConfig'), isLoading: false }),
    [resetEventsHistory]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
