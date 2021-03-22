import { handleActions } from 'redux-actions';
import { changeTaskAssignee, getTaskList, resetTaskList, setTaskAssignee, setTaskList } from '../actions/tasks';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

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
    [getTaskList]: (state, { payload: { stateId } }) => updateState(state, stateId, { isLoading: true }),
    [changeTaskAssignee]: (state, { payload: { stateId } }) => updateState(state, stateId, { isLoading: true }),
    [setTaskList]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, { ...data, isLoading: false }),
    [setTaskAssignee]: (state, { payload: { stateId, ...data } }) => updateState(state, stateId, { ...data, isLoading: false }),
    [resetTaskList]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
