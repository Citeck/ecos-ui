import { handleActions } from 'redux-actions';
import { getActionHistory, setActionHistory } from '../actions/actionHistory';
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
    [getActionHistory]: startLoading,
    [setActionHistory]: (state, { payload: { stateId, list } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list: list,
        isLoading: false
      }
    })
  },
  {}
);
