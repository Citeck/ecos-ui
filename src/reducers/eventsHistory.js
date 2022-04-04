import { handleActions } from 'redux-actions';
import { getEventsHistory, resetEventsHistory, setEventsHistory, filterJournalHistory, getJournalHistory } from '../actions/eventsHistory';
import { deleteStateById, getCurrentStateById, startLoading, updateState } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: [],
  columns: []
};

export default handleActions(
  {
    [getEventsHistory]: startLoading(initialState),
    [getJournalHistory]: startLoading(initialState),
    [setEventsHistory]: (state, { payload: { stateId, list, columns } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list,
        columns,
        isLoading: false
      }
    }),
    [filterJournalHistory]: (state, { payload: { stateId } }) => updateState(state, stateId, { isLoading: true }),
    [resetEventsHistory]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
