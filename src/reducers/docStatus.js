import { handleActions } from 'redux-actions';
import { getDocStatus, setDocStatus } from '../actions/docStatus';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  status: {}
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
    [getDocStatus]: startLoading,
    [setDocStatus]: (state, { payload: { stateId, status } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        status,
        isLoading: false
      }
    })
  },
  {}
);
