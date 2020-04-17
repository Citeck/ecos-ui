import { handleActions } from 'redux-actions';
import { getFormList, resetData, setFormList } from '../actions/properties';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  forms: {
    list: [],
    isLoading: false,
    totalCount: 0
  }
};

export default handleActions(
  {
    [getFormList]: (state, { payload }) => {
      const { stateId } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          forms: { ...initialState.forms, isLoading: true }
        }
      };
    },
    [setFormList]: (state, { payload }) => {
      const { stateId, ...data } = payload;

      return {
        ...state,
        [stateId]: {
          ...getCurrentStateById(state, stateId, initialState),
          forms: {
            ...data,
            isLoading: false
          }
        }
      };
    },
    [resetData]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  {}
);
