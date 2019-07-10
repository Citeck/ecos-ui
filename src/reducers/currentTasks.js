import { handleActions } from 'redux-actions';
import { changeTaskAssignee, getCurrentTaskList, setCurrentTaskList, setTaskAssignee } from '../actions/tasks';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: []
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
    [getCurrentTaskList]: startLoading,
    [changeTaskAssignee]: startLoading,
    [setCurrentTaskList]: (state, { payload: { stateId, list } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list: list,
        isLoading: false
      }
    }),
    [setTaskAssignee]: (state, { payload: { stateId, list } }) => {
      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          list,
          isLoading: false
        }
      };
    }
  },
  {}
);
