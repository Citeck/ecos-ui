import { handleActions } from 'redux-actions';

import { getProcesses, setFilter, setPage, setProcesses, setTotalCount } from '../actions/bpmnAdmin';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

export const initialState = {
  loading: false,

  processes: [],
  totalCount: 0,

  filter: undefined,
  page: DEFAULT_PAGINATION
};

Object.freeze(initialState);

export default handleActions(
  {
    [getProcesses]: (state, action) => {
      return {
        ...state,
        loading: true
      };
    },
    [setFilter]: (state, action) => {
      return {
        ...state,
        page: initialState.page,
        filter: action.payload
      };
    },
    [setPage]: (state, action) => {
      return {
        ...state,
        page: action.payload
      };
    },
    [setProcesses]: (state, action) => {
      return {
        ...state,
        loading: false,
        processes: action.payload
      };
    },
    [setTotalCount]: (state, action) => {
      return {
        ...state,
        totalCount: action.payload
      };
    }
  },
  initialState
);
