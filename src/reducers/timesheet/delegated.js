import get from 'lodash/get';
import { handleActions } from 'redux-actions';
import {
  declineDelegation,
  getDelegatedDeputies,
  getDelegatedTimesheetByParams,
  modifyStatus,
  resetDelegatedTimesheet,
  setDelegatedDeputies,
  setDelegatedTimesheetByParams,
  setLoading,
  setMergedList,
  setPopupMessage,
  setUpdatingEventDayHours
} from '../../actions/timesheet/delegated';

const initialState = {
  isLoading: false,
  isLoadingDeputies: false,
  mergedList: [],
  deputyList: [],
  popupMsg: '',
  innerCounts: {
    all: 0
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [setPopupMessage]: (state, actions) => ({
      ...state,
      popupMsg: actions.payload
    }),
    [setLoading]: (state, actions) => ({
      ...state,
      isLoading: actions.payload
    }),
    [setMergedList]: (state, actions) => ({
      ...state,
      mergedList: actions.payload || [],
      isLoading: false
    }),
    [resetDelegatedTimesheet]: (state, actions) => ({
      ...initialState
    }),
    [getDelegatedTimesheetByParams]: (state, actions) => ({
      ...state,
      ...initialState,
      isLoading: true
    }),
    [setDelegatedTimesheetByParams]: (state, actions) => ({
      ...state,
      mergedList: get(actions, 'payload.mergedList', []),
      innerCounts: get(actions, 'payload.innerCounts', {}),
      isLoading: false
    }),
    [setUpdatingEventDayHours]: (state, actions) => ({
      ...state,
      updatingHours: actions.payload
    }),
    [modifyStatus]: (state, actions) => ({
      ...state,
      isLoading: true
    }),
    [declineDelegation]: (state, actions) => ({
      ...state,
      isLoading: true
    }),
    [getDelegatedDeputies]: (state, actions) => ({
      ...state,
      isLoadingDeputies: true,
      deputyList: []
    }),
    [setDelegatedDeputies]: (state, actions) => ({
      ...state,
      isLoadingDeputies: false,
      deputyList: actions.payload
    })
  },
  initialState
);
