import { handleActions } from 'redux-actions';
import { getEventsHistory, resetEventsHistory, setEventsHistory } from '../actions/eventsHistory';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: [],
  columns: []
};

const startLoading = (state, { payload: { stateId } }) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateById(state, stateId, initialState),
    isLoading: true
  }
});

export default handleActions(
  {
    [getEventsHistory]: startLoading,
    [setEventsHistory]: (state, { payload: { stateId, list, columns } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list,
        columns,
        isLoading: false
      }
    }),
    [resetEventsHistory]: (state, { payload: { stateId } }) => {
      delete state[stateId];

      return state;
    }
  },
  {}
);
