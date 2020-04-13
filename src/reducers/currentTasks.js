import { handleActions } from 'redux-actions';
import { getCurrentTaskList, resetCurrentTaskList, setCurrentTaskList } from '../actions/currentTasks';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  list: [],
  totalCount: 0
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
    [getCurrentTaskList]: (state, { payload: { stateId } }) => updateState(state, stateId, { ...initialState, isLoading: true }),
    [setCurrentTaskList]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, { ...data, isLoading: false }),
    [resetCurrentTaskList]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  commonInitialState
);
