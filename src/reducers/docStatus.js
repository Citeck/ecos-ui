import { handleActions } from 'redux-actions';
import {
  changeDocStatus,
  getAvailableToChangeStatuses,
  getDocStatus,
  initDocStatus,
  resetDocStatus,
  setAvailableToChangeStatuses,
  setDocStatus
} from '../actions/docStatus';
import { deleteStateById, getCurrentStateById, startLoading } from '../helpers/redux';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  status: {},
  availableToChangeStatuses: []
};

export default handleActions(
  {
    [initDocStatus]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...initialState
      }
    }),
    [getDocStatus]: startLoading(initialState),
    [setDocStatus]: (state, { payload: { stateId, status } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        status,
        isLoading: false
      }
    }),
    [getAvailableToChangeStatuses]: startLoading(initialState),
    [setAvailableToChangeStatuses]: (state, { payload: { stateId, availableToChangeStatuses } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        availableToChangeStatuses
      }
    }),
    [changeDocStatus]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        status: {},
        isLoading: true
      }
    }),
    [resetDocStatus]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  commonInitialState
);
