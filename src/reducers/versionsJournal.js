import { handleActions } from 'redux-actions';
import { addNewVersion, addNewVersionError, addNewVersionSuccess, setVersions } from '../actions/versionsJournal';

const initialState = {
  versions: [],
  hasMore: false,
  totalCount: 0,
  addModalIsLoading: false,
  listIsLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setVersions]: (state, { payload }) => ({
      ...state,
      hasMore: payload.hasMore,
      totalCount: payload.totalCount,
      versions: payload.versions
    }),
    [addNewVersion]: state => ({
      ...state,
      addModalIsLoading: true
    }),
    [addNewVersionSuccess]: state => ({
      ...state,
      addModalIsLoading: false
    }),
    [addNewVersionError]: state => ({
      ...state,
      addModalIsLoading: false
    })
  },
  initialState
);
