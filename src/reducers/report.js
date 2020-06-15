import { handleActions } from 'redux-actions';

import { getReportData, setReportData, resetStore } from '../actions/report';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  reportData: {
    urgent: {
      records: [],
      count: 0
    },
    today: {
      records: [],
      count: 0
    },
    later: {
      records: [],
      count: 0
    },
    totalCount: 0
  }
};

const startLoading = (state, { payload }) => ({
  ...state,
  [payload]: {
    ...getCurrentStateById(state, payload, initialState),
    isLoading: true
  }
});

export default handleActions(
  {
    [getReportData]: startLoading,
    [setReportData]: (state, { payload }) => {
      return {
        ...state,
        [payload.stateId]: {
          ...state[payload.stateId],
          reportData: {
            ...state[payload.stateId].reportData,
            urgent: {
              ...state[payload.stateId].reportData.urgent,
              ...payload.reportData.urgent
            },
            today: {
              ...state[payload.stateId].reportData.urgent,
              ...payload.reportData.today
            },
            later: {
              ...state[payload.stateId].reportData.urgent,
              ...payload.reportData.later
            },
            totalCount: payload.reportData.totalCount
          },
          isLoading: false
        }
      };
    },
    [resetStore]: (state, { payload }) => deleteStateById(state, payload)
  },
  {}
);
