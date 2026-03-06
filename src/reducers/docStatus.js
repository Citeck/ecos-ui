import { handleActions } from 'redux-actions';
import {
  changeDocStatus,
  getAvailableToChangeStatuses,
  getDocStatus,
  initDocStatus,
  resetDocStatus,
  setAvailableToChangeStatuses,
  setChangeResult,
  setDocStatus
} from '../actions/docStatus';
import { deleteStateById, getCurrentStateById, startLoading } from '../helpers/redux';

const commonInitialState = {};

const initialState = {
  isLoading: false,
  isChanging: false,
  changeResult: null,
  status: {},
  availableToChangeStatuses: []
};

export default handleActions(
  {
    [initDocStatus]: (state, { payload: { stateId } }) => {
      const current = getCurrentStateById(state, stateId, initialState);
      return {
        ...state,
        [stateId]: {
          ...initialState,
          status: current.status
        }
      };
    },
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
        availableToChangeStatuses,
        isLoading: false
      }
    }),
    [changeDocStatus]: (state, { payload: { stateId } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        isChanging: true,
        changeResult: null
      }
    }),
    [setChangeResult]: (state, { payload: { stateId, changeResult } }) => ({
      ...state,
      [stateId]: {
        ...getCurrentStateById(state, stateId, initialState),
        changeResult,
        isChanging: false
      }
    }),
    [resetDocStatus]: (state, { payload: { stateId } }) => deleteStateById(state, stateId)
  },
  commonInitialState
);
