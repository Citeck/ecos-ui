import { handleActions } from 'redux-actions';
import { getEventsHistory, resetEventsHistory, setEventsHistory } from '../actions/eventsHistory';
import { deleteStateById, getCurrentStateById, startLoading } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: [],
  columns: []
};

export default handleActions(
  {
    [getEventsHistory]: startLoading(initialState),
    [setEventsHistory]: (state, { payload: { stateId, list, columns } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list,
        columns,
        isLoading: false
      }
    }),
    [resetEventsHistory]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
