import { handleActions } from 'redux-actions';
import { backExecuteAction, getActions, resetActions, runExecuteAction, setActions } from '../actions/recordActions';
import { deleteStateById, getCurrentStateById, startLoading } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: []
};

export default handleActions(
  {
    [getActions]: startLoading(initialState),
    [runExecuteAction]: startLoading(initialState),
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
