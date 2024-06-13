import { handleActions } from 'redux-actions';
import { backExecuteAction, getActions, resetActions, setLoading, setActions } from '../actions/recordActions';
import { deleteStateById, getCurrentStateById, startLoading } from '../helpers/redux';

const initialState = {
  isLoading: false,
  list: []
};

export default handleActions(
  {
    [getActions]: startLoading(initialState),
    [setLoading]: (state, { payload: { stateId, isLoading = true } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        isLoading
      }
    }),
    [setActions]: (state, { payload: { stateId, list } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        list,
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
