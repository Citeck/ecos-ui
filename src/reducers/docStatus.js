import { handleActions } from 'redux-actions';
import {
  changeDocStatus,
  getAvailableToChangeStatuses,
  getCheckDocStatus,
  getDocStatus,
  initDocStatus,
  resetDocStatus,
  setAvailableToChangeStatuses,
  setCheckDocStatus,
  setDocStatus
} from '../actions/docStatus';
import { getCurrentStateById } from '../helpers/redux';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  isUpdating: true,
  countAttempt: 0,
  status: {},
  availableToChangeStatuses: []
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
    [initDocStatus]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...initialState
      }
    }),
    [getDocStatus]: startLoading,
    [getAvailableToChangeStatuses]: startLoading,
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
    [setAvailableToChangeStatuses]: (state, { payload: { stateId, availableToChangeStatuses } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        availableToChangeStatuses,
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
    }),
    [resetDocStatus]: (state, { payload: { stateId } }) => {
      delete state[stateId];

      return state;
    }
  },
  commonInitialState
);
