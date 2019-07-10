import { handleActions } from 'redux-actions';
import { changeDocStatus, getAvailableStatuses, getDocStatus, setAvailableStatuses, setDocStatus } from '../actions/docStatus';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  status: {},
  availableStatuses: []
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
    [getAvailableStatuses]: startLoading,
    [changeDocStatus]: startLoading,
    [setDocStatus]: (state, { payload: { stateId, status } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        status,
        isLoading: false
      }
    }),
    [setAvailableStatuses]: (state, { payload: { stateId, availableStatuses } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        availableStatuses,
        isLoading: false
      }
    })
  },
  {}
);
