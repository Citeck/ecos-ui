import { handleActions } from 'redux-actions';
import {
  changeDocStatus,
  getAvailableStatuses,
  getCheckDocStatus,
  getDocStatus,
  setAvailableStatuses,
  setCheckDocStatus,
  setDocStatus
} from '../actions/docStatus';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  isUpdating: false,
  countAttempt: 0,
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

const increaseAttempt = (state, stateId) => {
  const cState = getCurrentStateById(state, stateId, initialState);
  const count = cState.countAttempt || 0;

  return { countAttempt: count + 1 };
};

export default handleActions(
  {
    [getDocStatus]: startLoading,
    [getAvailableStatuses]: startLoading,
    [getCheckDocStatus]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        ...increaseAttempt(state, stateId),
        isLoading: true
      }
    }),
    [changeDocStatus]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        status: {},
        isLoading: true,
        isUpdating: true,
        countAttempt: 0
      }
    }),
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
    }),
    [setCheckDocStatus]: (state, { payload: { stateId, isUpdating } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        isUpdating,
        isLoading: false
      }
    })
  },
  {}
);
