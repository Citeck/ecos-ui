import { handleActions } from 'redux-actions';
import { backExecuteAction, getActions, resetActions, runExecuteAction, setActions } from '../actions/recordActions';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

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
    [getActions]: startLoading,
    [runExecuteAction]: startLoading,
    [setActions]: (state, { payload: { stateId, list } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list: list,
        isLoading: false
      }
    }),
    [backExecuteAction]: (state, { payload: { stateId } }) => {
      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          isLoading: false
        }
      };
    },
    [resetActions]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
